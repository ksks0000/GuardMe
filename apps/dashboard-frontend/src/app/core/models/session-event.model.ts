export type SessionEventType = 'LOGIN' | 'LOGOUT';

/* Mirrors backend SessionEventPayload / WS SESSION_EVENT */
export interface SessionEvent {
  type: SessionEventType;
  userId: string;
  username: string;
  timestamp: string;
}
