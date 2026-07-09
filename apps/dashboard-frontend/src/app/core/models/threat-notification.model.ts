import { SiemEventSeverity, SiemEventType } from './security-event.model';

export interface ThreatNotification {
  id: string;
  type: SiemEventType;
  title: string;
  message: string;
  severity: SiemEventSeverity;
  timestamp: string;
  metadata: Record<string, unknown>;
  read: boolean;
  dismissed: boolean;
}

export type ThreatNotificationPayload = Omit<ThreatNotification, 'read' | 'dismissed'>;
