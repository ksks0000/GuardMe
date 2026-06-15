import { SecurityEvent } from '@prisma/client';
import { SecurityEventDetailPayload } from '../dto/security-event-detail.payload';
import { toSecurityEventPayload } from '../../websocket/utils/payload-mapper.util';

export function toSecurityEventDetailPayload(
  row: SecurityEvent,
): SecurityEventDetailPayload {
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : undefined;

  return {
    ...toSecurityEventPayload(row),
    metadata,
  };
}
