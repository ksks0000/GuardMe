import { SecurityEvent } from './security-event.model';
import { TrafficLog } from './traffic-log.model';

export type ActivityItem =
  | { kind: 'traffic'; id: string; timestamp: string; data: TrafficLog }
  | { kind: 'security'; id: string; timestamp: string; data: SecurityEvent };
