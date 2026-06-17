import { Injectable, Logger } from '@nestjs/common';
import { IncomingMessage } from 'node:http';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { extractClientIp } from '../../common/utils/request-context.util';
import { FIREWALL_RULE_ACTIONS } from '../../config/policy.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { RulesService } from '../rules/rules.service';
import { RuleMatchResult } from '../rules/utils/rule-matcher.util';
import { SiemService } from '../siem/siem.service';
import { ThreatScanResult } from '../threat/dto/threat-scan.result';
import { ThreatVerdict } from '../threat/dto/threat-verdict.enum';
import { ThreatService } from '../threat/threat.service';
import { BlockPageService } from './block-page.service';
import { BypassTokenService } from './bypass-token.service';
import { InspectionService } from './inspection.service';
import { PolicyService } from './policy.service';
import { ThreatScanCacheService } from './threat-scan-cache.service';
import { WarningPageService } from './warning-page.service';
import { ProxyForwardService } from './proxy-forward.service';
import { PolicyDecision } from './dto/policy-decision.enum';
import { PolicyResult } from './dto/policy.result';
import { buildThreatSummary } from './utils/threat-summary.util';
import { buildProceedUrl } from './utils/proceed-url.util';
import { resolveDestinationIp } from './utils/dns.util';

@Injectable()
export class ProxyPipelineService {
  private readonly logger = new Logger(ProxyPipelineService.name);

  constructor(
    private readonly inspectionService: InspectionService,
    private readonly threatService: ThreatService,
    private readonly threatScanCache: ThreatScanCacheService,
    private readonly policyService: PolicyService,
    private readonly rulesService: RulesService,
    private readonly siemService: SiemService,
    private readonly bypassTokenService: BypassTokenService,
    private readonly blockPageService: BlockPageService,
    private readonly warningPageService: WarningPageService,
    private readonly proxyForwardService: ProxyForwardService,
  ) {}

  async handleHttp(
    req: Request,
    res: Response,
    user: AuthenticatedUser,
  ): Promise<void> {
    try {
      const inspection = this.inspectionService.inspect(req);
      const clientIp = extractClientIp(req);

      if (
        inspection.bypassToken &&
        this.bypassTokenService.verifyAndConsume(
          inspection.bypassToken,
          inspection.normalizedUrl,
          user.userId,
          user.sessionId,
        )
      ) {
        void this.siemService.logSecurityEvent({
          type: SIEM_EVENT_TYPES.SUSPICIOUS_PROCEED,
          message: 'User proceeded past security warning',
          metadata: {
            url: inspection.normalizedUrl,
            userId: user.userId,
            sessionId: user.sessionId,
          },
        });

        await this.logTraffic(user.userId, clientIp, inspection, {
          decision: PolicyDecision.ALLOW,
          reason: 'User bypassed warning interstitial',
          riskScore: 50,
          threatVerdict: ThreatVerdict.SUSPICIOUS,
        });

        await this.proxyForwardService.forward(req, res, inspection);
        return;
      }

      const userRulePolicy = await this.evaluateUserRules(
        user.userId,
        inspection.destinationHost,
        inspection.normalizedUrl,
        user.sessionId,
      );
      if (userRulePolicy) {
        await this.logTraffic(user.userId, clientIp, inspection, userRulePolicy);
        await this.respondForPolicy(
          res,
          inspection.normalizedUrl,
          userRulePolicy,
          null,
        );
        if (userRulePolicy.decision === PolicyDecision.ALLOW) {
          await this.proxyForwardService.forward(req, res, inspection);
        }
        return;
      }

      const threatScan = await this.scanWithCache(inspection.normalizedUrl);
      const fileScan = this.inspectionService.simulateFileScan(inspection);
      const policy = this.policyService.decide(threatScan, fileScan);

      await this.logTraffic(user.userId, clientIp, inspection, policy);
      await this.logMaliciousBlocked(policy, inspection.normalizedUrl, user.userId);

      if (policy.decision === PolicyDecision.BLOCK) {
        this.respondHtml(
          res,
          403,
          this.blockPageService.render({
            url: inspection.normalizedUrl,
            reason: policy.reason,
            timestamp: new Date(),
            riskScore: policy.riskScore,
          }),
        );
        return;
      }

      if (policy.decision === PolicyDecision.WARN) {
        const bypassToken = this.bypassTokenService.sign(
          inspection.normalizedUrl,
          user.userId,
          user.sessionId,
        );

        this.respondHtml(
          res,
          403,
          this.warningPageService.render(
            this.warningPageService.buildContext({
              url: inspection.normalizedUrl,
              reason: policy.reason,
              threatSummary: buildThreatSummary(threatScan),
              riskScore: policy.riskScore,
              proceedUrl: buildProceedUrl(
                inspection.normalizedUrl,
                bypassToken,
              ),
            }),
          ),
        );
        return;
      }

      await this.proxyForwardService.forward(req, res, inspection);
    } catch (error) {
      this.logger.error(
        'Proxy pipeline failed',
        error instanceof Error ? error.stack : undefined,
      );

      void this.siemService.logSecurityEvent({
        type: SIEM_EVENT_TYPES.PROXY_ERROR,
        message: 'Internal proxy error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.url,
        },
      });

      this.respondHtml(
        res,
        500,
        this.blockPageService.render({
          url: req.url,
          reason: 'Internal proxy error',
          timestamp: new Date(),
          riskScore: 100,
        }),
      );
    }
  }

  async evaluateConnect(
    host: string,
    port: number,
    user: AuthenticatedUser,
    req: IncomingMessage,
  ): Promise<PolicyDecision> {
    const inspection = this.inspectionService.buildConnectInspection(host, port);
    const clientIp = this.extractClientIpFromMessage(req);

    const userRulePolicy = await this.evaluateUserRules(
      user.userId,
      inspection.destinationHost,
      inspection.normalizedUrl,
      user.sessionId,
    );
    if (userRulePolicy) {
      await this.logTraffic(user.userId, clientIp, inspection, userRulePolicy);
      if (userRulePolicy.decision === PolicyDecision.ALLOW) {
        return PolicyDecision.ALLOW;
      }
      return PolicyDecision.BLOCK;
    }

    const threatScan = await this.scanWithCache(inspection.normalizedUrl);
    const policy = this.policyService.decide(threatScan);

    await this.logTraffic(user.userId, clientIp, inspection, policy);
    await this.logMaliciousBlocked(policy, inspection.normalizedUrl, user.userId);

    if (policy.decision === PolicyDecision.WARN) {
      return PolicyDecision.BLOCK;
    }

    return policy.decision;
  }

  private async evaluateUserRules(
    userId: string,
    destinationHost: string,
    url: string,
    sessionId: string,
  ): Promise<PolicyResult | null> {
    const match = await this.rulesService.evaluateRules(userId, {
      destinationHost,
    });

    if (!match) {
      return null;
    }

    this.logRuleMatch(match, url, userId, sessionId);
    return this.policyFromUserRule(match);
  }

  private policyFromUserRule(match: RuleMatchResult): PolicyResult {
    const label = match.ruleName ?? match.pattern;

    if (match.action === FIREWALL_RULE_ACTIONS.BLOCK) {
      return {
        decision: PolicyDecision.BLOCK,
        reason: `Blocked by user rule: ${label}`,
        riskScore: 100,
        threatVerdict: ThreatVerdict.UNVERIFIED,
        matchedRuleId: match.ruleId,
        metadata: {
          source: 'user_rule',
          ruleType: match.ruleType,
          pattern: match.pattern,
        },
      };
    }

    return {
      decision: PolicyDecision.ALLOW,
      reason: `Allowed by user whitelist rule: ${label}`,
      riskScore: 0,
      threatVerdict: ThreatVerdict.SAFE,
      matchedRuleId: match.ruleId,
      metadata: {
        source: 'user_rule',
        ruleType: match.ruleType,
        pattern: match.pattern,
        skippedThreatScan: true,
      },
    };
  }

  private logRuleMatch(
    match: RuleMatchResult,
    url: string,
    userId: string,
    sessionId: string,
  ): void {
    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.RULE_MATCH,
      message: `User firewall rule matched (${match.action})`,
      metadata: {
        url,
        userId,
        sessionId,
        ruleId: match.ruleId,
        ruleType: match.ruleType,
        pattern: match.pattern,
        action: match.action,
      },
    });
  }

  private async logMaliciousBlocked(
    policy: PolicyResult,
    url: string,
    userId: string,
  ): Promise<void> {
    if (
      policy.decision !== PolicyDecision.BLOCK ||
      policy.threatVerdict !== ThreatVerdict.MALICIOUS ||
      policy.matchedRuleId
    ) {
      return;
    }

    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.MALICIOUS_BLOCKED,
      message: 'Malicious URL blocked by threat intelligence',
      metadata: {
        url,
        userId,
        riskScore: policy.riskScore,
        threatVerdict: policy.threatVerdict,
      },
    });
  }

  private async respondForPolicy(
    res: Response,
    url: string,
    policy: PolicyResult,
    threatScan: ThreatScanResult | null,
  ): Promise<void> {
    if (policy.decision === PolicyDecision.BLOCK) {
      this.respondHtml(
        res,
        403,
        this.blockPageService.render({
          url,
          reason: policy.reason,
          timestamp: new Date(),
          riskScore: policy.riskScore,
        }),
      );
      return;
    }

    if (policy.decision === PolicyDecision.WARN && threatScan) {
      this.respondHtml(
        res,
        403,
        this.warningPageService.render(
          this.warningPageService.buildContext({
            url,
            reason: policy.reason,
            threatSummary: buildThreatSummary(threatScan),
            riskScore: policy.riskScore,
            proceedUrl: url,
          }),
        ),
      );
    }
  }

  private async scanWithCache(url: string): Promise<ThreatScanResult> {
    const cached = this.threatScanCache.get(url);
    if (cached) {
      return cached;
    }

    const result = await this.threatService.scanUrl(url);
    if (!result.metadata.failSafe) {
      this.threatScanCache.set(url, result);
    }

    return result;
  }

  private async logTraffic(
    userId: string,
    clientIp: string,
    inspection: {
      normalizedUrl: string;
      destinationHost: string;
      destinationPort: number | null;
      method: string;
    },
    policy: Pick<
      PolicyResult,
      'decision' | 'reason' | 'riskScore' | 'threatVerdict' | 'matchedRuleId'
    >,
  ): Promise<void> {
    const timestamp = new Date();
    const threatVerdict = policy.threatVerdict;

    void (async () => {
      const destinationIp = await resolveDestinationIp(
        inspection.destinationHost,
      );

      await this.siemService.logTraffic({
        userId,
        clientIp,
        url: inspection.normalizedUrl,
        destinationHost: inspection.destinationHost,
        destinationPort: inspection.destinationPort,
        destinationIp,
        method: inspection.method,
        policyDecision: policy.decision,
        threatVerdict,
        matchedRuleId: policy.matchedRuleId ?? null,
        riskScore: policy.riskScore,
        timestamp,
      });
    })();
  }

  private extractClientIpFromMessage(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    return req.socket.remoteAddress ?? 'unknown';
  }

  private respondHtml(res: Response, status: number, html: string): void {
    res
      .status(status)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(html);
  }
}
