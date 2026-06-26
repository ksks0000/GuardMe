import {
  DEFAULT_EVENT_SEVERITIES,
  SiemEventSeverity,
  SiemEventType,
} from '../../../config/siem.config';

export interface SecurityEventInput {
  type: SiemEventType;
  message: string;
  severity?: SiemEventSeverity;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export function resolveEventSeverity(
  type: SiemEventType,
  severity?: SiemEventSeverity,
): SiemEventSeverity {
  return severity ?? DEFAULT_EVENT_SEVERITIES[type];
}

export function buildSecurityEventActorMetadata(
  userId: string,
  username?: string | null,
): { userId: string; username?: string } {
  const metadata: { userId: string; username?: string } = { userId };
  if (username) {
    metadata.username = username;
  }
  return metadata;
}
