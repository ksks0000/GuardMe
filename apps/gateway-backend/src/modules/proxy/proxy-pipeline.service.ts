import { Injectable, Logger } from '@nestjs/common';
import { IncomingMessage } from 'node:http';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { extractClientIp } from '../../common/utils/request-context.util';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
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

      const threatScan = await this.scanWithCache(inspection.normalizedUrl);
      const fileScan = this.inspectionService.simulateFileScan(inspection);
      const policy = this.policyService.decide(threatScan, fileScan);

      await this.logThreatScan(threatScan, inspection.normalizedUrl);
      await this.logTraffic(user.userId, clientIp, inspection, policy);

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
    const threatScan = await this.scanWithCache(inspection.normalizedUrl);
    const policy = this.policyService.decide(threatScan);

    await this.logThreatScan(threatScan, inspection.normalizedUrl);
    await this.logTraffic(user.userId, clientIp, inspection, policy);

    if (policy.decision === PolicyDecision.WARN) {
      return PolicyDecision.BLOCK;
    }

    return policy.decision;
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

  private async logThreatScan(
    threatScan: ThreatScanResult,
    url: string,
  ): Promise<void> {
    if (threatScan.metadata.failSafe) {
      return;
    }

    void this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.THREAT_SCAN_COMPLETED,
      message: `Threat scan completed with verdict ${threatScan.verdict}`,
      metadata: {
        url,
        verdict: threatScan.verdict,
        riskScore: threatScan.riskScore,
        provider: threatScan.provider,
      },
    });
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
      'decision' | 'reason' | 'riskScore' | 'threatVerdict'
    >,
  ): Promise<void> {
    const timestamp = new Date();

    // Fire-and-forget: DNS resolution and the DB write happen off the
    // request path so logging never delays or blocks the proxied response.
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
        verdict: policy.decision,
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
