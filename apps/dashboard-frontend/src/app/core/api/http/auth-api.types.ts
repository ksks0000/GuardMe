// Response body from POST /auth/register and POST /auth/login
export interface PublicUserProfileResponse {
  id: string;
  username: string;
  createdAt: string;
  lastAuthAt: string | null;
}

// Response body from GET /auth/me
export interface AuthMeResponse {
  id: string;
  username: string;
  fingerprintMatched: boolean;
  lastAuthAt: string | null;
}

// Response body from POST /auth/verify-password
export interface VerifyPasswordResponse {
  message: string;
  lastAuthAt: string;
}
