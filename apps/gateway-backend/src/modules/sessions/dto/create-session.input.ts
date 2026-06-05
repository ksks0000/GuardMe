export interface CreateSessionInput {
  userId: string;
  jwtId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}
