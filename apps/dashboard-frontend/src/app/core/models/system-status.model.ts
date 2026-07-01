export type HealthState = 'ok' | 'degraded';

// Mirrors backend SystemStatusPayload / WS SYSTEM_STATUS event
export interface SystemStatus {
  db: HealthState;
  virusTotal: HealthState;
  timestamp: string;
}
