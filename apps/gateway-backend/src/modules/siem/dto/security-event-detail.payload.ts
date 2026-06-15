import { SecurityEventPayload } from '../../websocket/dto/security-event.payload';

export interface SecurityEventDetailPayload extends SecurityEventPayload {
  metadata?: Record<string, unknown>;
}
