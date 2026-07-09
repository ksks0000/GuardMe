import { SIEM_EVENT_TYPES, SiemEventType } from './siem.config';

// Security event types that produce a user-visible threat notification
export const NOTIFIABLE_EVENT_TYPES = new Set<SiemEventType>([
  SIEM_EVENT_TYPES.ANOMALY_DETECTED,
  SIEM_EVENT_TYPES.MALICIOUS_BLOCKED,
  SIEM_EVENT_TYPES.FINGERPRINT_MISMATCH,
  SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE,
  SIEM_EVENT_TYPES.THREAT_SCAN_TIMEOUT,
  SIEM_EVENT_TYPES.SUSPICIOUS_PROCEED,
]);

export const NOTIFICATION_EMIT_EVENTS = {
  THREAT_NOTIFICATION: 'notification.threat',
} as const;

const NOTIFICATION_TITLES: Record<SiemEventType, string> = {
  [SIEM_EVENT_TYPES.ANOMALY_DETECTED]: 'Unusual activity detected',
  [SIEM_EVENT_TYPES.MALICIOUS_BLOCKED]: 'Malicious site blocked',
  [SIEM_EVENT_TYPES.FINGERPRINT_MISMATCH]: 'Session fingerprint mismatch',
  [SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE]: 'Threat scan unavailable',
  [SIEM_EVENT_TYPES.THREAT_SCAN_TIMEOUT]: 'Threat scan timed out',
  [SIEM_EVENT_TYPES.SUSPICIOUS_PROCEED]: 'Suspicious site accessed',
  [SIEM_EVENT_TYPES.AUTH_FAILURE]: 'Authentication failed',
  [SIEM_EVENT_TYPES.SESSION_REVOKED]: 'Session revoked',
  [SIEM_EVENT_TYPES.REAUTH_REQUIRED]: 'Re-authentication required',
  [SIEM_EVENT_TYPES.REAUTH_FAILURE]: 'Re-authentication failed',
  [SIEM_EVENT_TYPES.RULE_MATCH]: 'Firewall rule matched',
  [SIEM_EVENT_TYPES.PROXY_ERROR]: 'Proxy error',
  [SIEM_EVENT_TYPES.VAULT_UNLOCKED]: 'Vault unlocked',
  [SIEM_EVENT_TYPES.VAULT_UNLOCK_FAILURE]: 'Vault unlock failed',
  [SIEM_EVENT_TYPES.VAULT_DECRYPT_FAILURE]: 'Vault decrypt failed',
};

export function resolveNotificationTitle(type: SiemEventType): string {
  return NOTIFICATION_TITLES[type] ?? 'Security alert';
}

const SAFE_METADATA_KEYS = new Set([
  'url',
  'destinationHost',
  'riskScore',
  'anomalyScore',
  'signals',
  'reason',
  'failStrategy',
  'source',
  'action',
  'threatVerdict',
  'policyDecision',
  'clientIp',
  'attemptedUsername',
]);

export function sanitizeNotificationMetadata(
  metadata: unknown,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_METADATA_KEYS.has(key)) {
      continue;
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) &&
        value.every((item) => typeof item === 'string'))
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
