import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { threatConfig } from '../../config/threat.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { SiemService } from '../siem/siem.service';
import { ThreatScanResult } from './dto/threat-scan.result';
import { ThreatVerdict } from './dto/threat-verdict.enum';
import {
  THREAT_RISK_SCORES,
  VirusTotalProvider,
} from './providers/virustotal.provider';

@Injectable()
export class ThreatService {
  constructor(
    private readonly virusTotalProvider: VirusTotalProvider,
    private readonly siemService: SiemService,
  ) {}

  async scanUrl(url: string): Promise<ThreatScanResult> {
    const apiKey = threatConfig.virusTotalApiKey();
    if (!apiKey) {
      return this.failSafeResult(url, {
        eventType: SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE,
        message: 'VirusTotal API key is missing; allowing as UNVERIFIED',
        metadata: { url, reason: 'missing_api_key' },
      });
    }

    try {
      return await this.virusTotalProvider.scanUrl(url);
    } catch (error) {
      const isTimeout = this.isTimeoutError(error);

      return this.failSafeResult(url, {
        eventType: isTimeout
          ? SIEM_EVENT_TYPES.THREAT_SCAN_TIMEOUT
          : SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE,
        message: isTimeout
          ? 'VirusTotal scan timed out; allowing as UNVERIFIED'
          : 'VirusTotal scan failed; allowing as UNVERIFIED',
        metadata: {
          url,
          reason: isTimeout ? 'timeout' : 'api_error',
          error: this.extractErrorMessage(error),
        },
      });
    }
  }

  private failSafeResult(
    url: string,
    event: {
      eventType:
        | typeof SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE
        | typeof SIEM_EVENT_TYPES.THREAT_SCAN_TIMEOUT;
      message: string;
      metadata: Record<string, unknown>;
    },
  ): ThreatScanResult {
    void this.siemService.logSecurityEvent({
      type: event.eventType,
      message: event.message,
      metadata: event.metadata,
    });

    return {
      verdict: ThreatVerdict.UNVERIFIED,
      riskScore: THREAT_RISK_SCORES[ThreatVerdict.UNVERIFIED],
      scannedUrl: url,
      provider: 'virustotal',
      metadata: {
        failSafe: true,
        ...event.metadata,
      },
    };
  }

  private isTimeoutError(error: unknown): boolean {
    if (!(error instanceof AxiosError)) {
      return false;
    }

    return (
      error.code === 'ECONNABORTED' ||
      error.message.toLowerCase().includes('timeout')
    );
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      if (status) {
        return `HTTP ${status}${statusText ? ` ${statusText}` : ''}`;
      }
      return error.message;
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }
}
