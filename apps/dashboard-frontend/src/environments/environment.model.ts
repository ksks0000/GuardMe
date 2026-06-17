export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  wsUrl: string;
  // Minutes after login/verify-password before sensitive actions require re-auth
  reAuthTimeoutMinutes: number;
  // When true, SIEM and realtime use mock implementations unless overridden
  useMocks: boolean;
  // When true, auth uses HttpAuthApi even if useMocks is true
  useRealAuth: boolean;
  // When true, SIEM history uses HttpSiemApi even if useMocks is true
  useRealSiem: boolean;
  // When true, live dashboard uses SocketRealtimeApi even if useMocks is true
  useRealRealtime: boolean;
  // When true, firewall rules use HttpRulesApi even if useMocks is true
  useRealRules: boolean;
}
