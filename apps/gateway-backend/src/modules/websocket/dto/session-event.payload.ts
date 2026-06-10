export type SessionEventType = 'LOGIN' | 'LOGOUT';

export interface SessionEventPayload {
  type: SessionEventType;
  userId: string;
  username: string;
  timestamp: string;
}
