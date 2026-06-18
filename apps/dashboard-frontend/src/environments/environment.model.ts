export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  wsUrl: string;
  // Minutes after login/verify-password before sensitive actions require re-auth
  reAuthTimeoutMinutes: number;
}
