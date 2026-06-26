import { Injectable } from '@nestjs/common';
import { threatConfig } from '../../config/threat.config';
import { ThreatScanResult } from '../threat/dto/threat-scan.result';
import { ThreatVerdict } from '../threat/dto/threat-verdict.enum';
import { FileScanResult } from './dto/file-scan.result';
import { PolicyDecision } from './dto/policy-decision.enum';
import { PolicyResult } from './dto/policy.result';

@Injectable()
export class PolicyService {
  decide(
    threatScan: ThreatScanResult,
    fileScan?: FileScanResult,
  ): PolicyResult {
    const filePolicy = this.decideFromFileScan(fileScan);
    if (filePolicy) {
      return filePolicy;
    }

    return this.decideFromThreatScan(threatScan);
  }

  private decideFromFileScan(
    fileScan: FileScanResult | undefined,
  ): PolicyResult | null {
    if (!fileScan) {
      return null;
    }

    if (fileScan.verdict === ThreatVerdict.MALICIOUS) {
      return {
        decision: PolicyDecision.BLOCK,
        reason: `Blocked file download: ${fileScan.reason}`,
        riskScore: fileScan.riskScore,
        threatVerdict: fileScan.verdict,
        metadata: {
          source: 'file_scan',
          fileName: fileScan.fileName,
        },
      };
    }

    if (fileScan.verdict === ThreatVerdict.SUSPICIOUS) {
      return {
        decision: PolicyDecision.WARN,
        reason: `Suspicious file download: ${fileScan.reason}`,
        riskScore: fileScan.riskScore,
        threatVerdict: fileScan.verdict,
        metadata: {
          source: 'file_scan',
          fileName: fileScan.fileName,
        },
      };
    }

    return null;
  }

  private decideFromThreatScan(threatScan: ThreatScanResult): PolicyResult {
    switch (threatScan.verdict) {
      case ThreatVerdict.MALICIOUS:
        return {
          decision: PolicyDecision.BLOCK,
          reason: 'URL flagged as malicious by threat intelligence',
          riskScore: threatScan.riskScore,
          threatVerdict: threatScan.verdict,
          metadata: {
            source: 'url_scan',
            provider: threatScan.provider,
            scanMetadata: threatScan.metadata,
          },
        };

      case ThreatVerdict.SUSPICIOUS:
        return {
          decision: PolicyDecision.WARN,
          reason: 'URL flagged as suspicious by threat intelligence',
          riskScore: threatScan.riskScore,
          threatVerdict: threatScan.verdict,
          metadata: {
            source: 'url_scan',
            provider: threatScan.provider,
            scanMetadata: threatScan.metadata,
          },
        };

      case ThreatVerdict.UNVERIFIED: {
        const failSafe = threatScan.metadata?.failSafe === true;
        if (failSafe && threatConfig.failClosed()) {
          return {
            decision: PolicyDecision.BLOCK,
            reason:
              'Threat scan unavailable; traffic blocked by fail-closed policy',
            riskScore: threatScan.riskScore,
            threatVerdict: threatScan.verdict,
            metadata: {
              source: 'url_scan',
              failClosed: true,
              provider: threatScan.provider,
              scanMetadata: threatScan.metadata,
            },
          };
        }

        return {
          decision: PolicyDecision.ALLOW,
          reason: failSafe
            ? 'Threat scan unavailable; traffic allowed by fail-open policy'
            : 'URL reputation could not be fully verified',
          riskScore: threatScan.riskScore,
          threatVerdict: threatScan.verdict,
          metadata: {
            source: 'url_scan',
            elevatedRisk: true,
            failSafe,
            provider: threatScan.provider,
            scanMetadata: threatScan.metadata,
          },
        };
      }

      case ThreatVerdict.SAFE:
      default:
        return {
          decision: PolicyDecision.ALLOW,
          reason: 'URL passed threat intelligence checks',
          riskScore: threatScan.riskScore,
          threatVerdict: threatScan.verdict,
          metadata: {
            source: 'url_scan',
            provider: threatScan.provider,
            scanMetadata: threatScan.metadata,
          },
        };
    }
  }
}
