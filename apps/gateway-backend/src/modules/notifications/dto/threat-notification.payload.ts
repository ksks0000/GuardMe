import { SiemEventSeverity, SiemEventType } from '../../../config/siem.config';

export interface ThreatNotificationPayload {
  id: string;
  type: SiemEventType;
  title: string;
  message: string;
  severity: SiemEventSeverity;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ThreatNotificationEmitPayload {
  userId: string;
  notification: ThreatNotificationPayload;
}