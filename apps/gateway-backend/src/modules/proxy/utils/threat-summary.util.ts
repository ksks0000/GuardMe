import { ThreatScanResult } from '../../threat/dto/threat-scan.result';

export function buildThreatSummary(threatScan: ThreatScanResult): string {
  const stats = threatScan.metadata.lastAnalysisStats as
    | {
        malicious?: number;
        suspicious?: number;
        harmless?: number;
        undetected?: number;
      }
    | undefined;

  if (!stats) {
    return `Threat provider reported ${threatScan.verdict.toLowerCase()} with risk score ${threatScan.riskScore}.`;
  }

  return `VirusTotal: ${stats.malicious ?? 0} malicious, ${stats.suspicious ?? 0} suspicious, ${stats.harmless ?? 0} harmless detections.`;
}
