export type HealthState = 'ok' | 'degraded';

export interface SystemStatusPayload {
  db: HealthState;
  virusTotal: HealthState;
  timestamp: string;
}
