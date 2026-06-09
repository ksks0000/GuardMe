import { ThreatVerdict } from '../../threat/dto/threat-verdict.enum';

export interface FileScanResult {
  fileName: string;
  verdict: ThreatVerdict;
  riskScore: number;
  reason: string;
}
