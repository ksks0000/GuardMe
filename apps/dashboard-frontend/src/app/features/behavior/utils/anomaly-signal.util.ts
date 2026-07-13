const ANOMALY_SIGNAL_LABELS: Record<string, string> = {
  new_host: 'New destination host',
  volume_spike: 'Request volume spike',
  off_hours_activity: 'Activity outside usual hours',
  repeated_blocks: 'Repeated blocked requests',
  high_risk_cluster: 'Cluster of high-risk traffic',
};

export function anomalySignalLabel(signal: string): string {
  return ANOMALY_SIGNAL_LABELS[signal] ?? signal;
}
