import { SecurityEvent, TrafficLog } from '@prisma/client';
import { SecurityEventPayload } from '../dto/security-event.payload';
import { TrafficLogPayload } from '../dto/traffic-log.payload';

export function toTrafficLogPayload(row: TrafficLog): TrafficLogPayload {
  return {
    id: row.id,
    userId: row.userId,
    clientIp: row.clientIp,
    url: row.url,
    destinationHost: row.destinationHost,
    destinationPort: row.destinationPort,
    method: row.method,
    verdict: row.verdict,
    riskScore: row.riskScore,
    timestamp: row.timestamp.toISOString(),
  };
}

export function toSecurityEventPayload(row: SecurityEvent): SecurityEventPayload {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}
