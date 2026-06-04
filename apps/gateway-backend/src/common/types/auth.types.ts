export interface JwtPayload {
  sub: string;
  jti: string;
}

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  jwtId: string;
  username: string;
  fingerprintMatched: boolean;
}
