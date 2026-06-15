export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  wsUrl: string;
  // When true, SIEM and realtime use mock implementations
  useMocks: boolean;
  // When true, auth uses HttpAuthApi even if useMocks is true 
  useRealAuth: boolean;
}
