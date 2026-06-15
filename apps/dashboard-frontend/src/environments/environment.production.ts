import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000/events',
  useMocks: false,
  useRealAuth: true,
};
