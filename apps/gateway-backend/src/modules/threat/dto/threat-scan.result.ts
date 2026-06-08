import { ThreatVerdict } from './threat-verdict.enum';

export interface ThreatScanResult {
  verdict: ThreatVerdict;
  riskScore: number;
  scannedUrl: string;
  provider: 'virustotal';
  metadata: Record<string, unknown>;
}
