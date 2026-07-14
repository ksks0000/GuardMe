import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'http://192.168.56.10:3000',
  wsUrl: 'http://192.168.56.10:3000/events',
  reAuthTimeoutMinutes: 15,
};
