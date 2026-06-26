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
import { buildSecurityEventActorMetadata } from '../siem/dto/security-event.input';
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
            ...buildSecurityEventActorMetadata(user.userId, user.username),
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
        user,
        inspection.destinationHost,
        inspection.normalizedUrl,
      );
      if (userRulePolicy) {
        await this.logTraffic(user.userId, clientIp, inspection, userRulePolicy);
        if (userRulePolicy.decision === PolicyDecision.ALLOW) {
          await this.proxyForwardService.forward(req, res, inspection);
        } else {
          this.respondBlock(res, inspection.normalizedUrl, userRulePolicy);
        }
        return;
      }

      const threatScan = await this.scanWithCache(inspection.normalizedUrl, user);
      const fileScan = this.inspectionService.simulateFileScan(inspection);
      const policy = this.policyService.decide(threatScan, fileScan);

      await this.logTraffic(user.userId, clientIp, inspection, policy);
      await this.logMaliciousBlocked(
        policy,
        inspection.normalizedUrl,
        user.userId,
        user.username,
      );

      if (policy.decision === PolicyDecision.BLOCK) {
        this.respondBlock(res, inspection.normalizedUrl, policy);
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
          ...buildSecurityEventActorMetadata(user.userId, user.username),
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
      user,
      inspection.destinationHost,
      inspection.normalizedUrl,
    );
    if (userRulePolicy) {
      await this.logTraffic(user.userId, clientIp, inspection, userRulePolicy);
      if (userRulePolicy.decision === PolicyDecision.ALLOW) {
        return PolicyDecision.ALLOW;
      }
      return PolicyDecision.BLOCK;
    }

    const threatScan = await this.scanWithCache(inspection.normalizedUrl, user);
    const policy = this.policyService.decide(threatScan);

    await this.logTraffic(user.userId, clientIp, inspection, policy);
    await this.logMaliciousBlocked(
      policy,
      inspection.normalizedUrl,
      user.userId,
      user.username,
    );

    if (policy.decision === PolicyDecision.WARN) {
      return PolicyDecision.BLOCK;
    }

    return policy.decision;
  }

  private async evaluateUserRules(
    user: AuthenticatedUser,
    destinationHost: string,
    url: string,
  ): Promise<PolicyResult | null> {
    const match = await this.rulesService.evaluateRules(
      user.userId,
      { destinationHost },
      () => resolveDestinationIp(destinationHost),
    );

    if (!match) {
      return null;
    }

    this.logRuleMatch(match, url, user);
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
      threatVerdict: ThreatVerdict.UNVERIFIED,
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
    user: AuthenticatedUser,
  ): void {
    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.RULE_MATCH,
      message: `User firewall rule matched (${match.action})`,
      metadata: {
        url,
        ...buildSecurityEventActorMetadata(user.userId, user.username),
        sessionId: user.sessionId,
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
    username: string,
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
        ...buildSecurityEventActorMetadata(userId, username),
        riskScore: policy.riskScore,
        threatVerdict: policy.threatVerdict,
      },
    });
  }

  private respondBlock(
    res: Response,
    url: string,
    policy: Pick<PolicyResult, 'reason' | 'riskScore'>,
  ): void {
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
  }

  private async scanWithCache(
    url: string,
    user: AuthenticatedUser,
  ): Promise<ThreatScanResult> {
    const cached = this.threatScanCache.get(url);
    if (cached) {
      return cached;
    }

    const result = await this.threatService.scanUrl(url, {
      userId: user.userId,
      username: user.username,
    });
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
