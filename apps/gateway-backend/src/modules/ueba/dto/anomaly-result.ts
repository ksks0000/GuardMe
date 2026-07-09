import { SiemEventSeverity } from '../../../config/siem.config';

export type AnomalySignal =
  | 'new_host'
  | 'volume_spike'
  | 'off_hours_activity'
  | 'repeated_blocks'
  | 'high_risk_cluster';

export interface AnomalyResult {
  anomalyScore: number;
  signals: AnomalySignal[];
  severity: SiemEventSeverity;
}
