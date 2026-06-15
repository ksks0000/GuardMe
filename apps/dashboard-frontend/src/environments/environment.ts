import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000/events',
  useMocks: true,
  useRealAuth: true,
  useRealSiem: true,
  useRealRealtime: true,
};
