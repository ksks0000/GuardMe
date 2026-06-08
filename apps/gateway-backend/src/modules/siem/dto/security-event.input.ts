import {
  DEFAULT_EVENT_SEVERITIES,
  SiemEventSeverity,
  SiemEventType,
} from '../../../config/siem.config';

export interface SecurityEventInput {
  type: SiemEventType;
  message: string;
  severity?: SiemEventSeverity;
  metadata?: Record<string, unknown>;
}

export function resolveEventSeverity(
  type: SiemEventType,
  severity?: SiemEventSeverity,
): SiemEventSeverity {
  return severity ?? DEFAULT_EVENT_SEVERITIES[type];
}
