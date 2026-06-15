import { corsConfig } from './cors.config';
import { parsePositiveNumber } from './env.util';

export const WEBSOCKET_CLIENT_EVENTS = {
  TRAFFIC_LOG: 'TRAFFIC_LOG',
  SECURITY_EVENT: 'SECURITY_EVENT',
  SYSTEM_STATUS: 'SYSTEM_STATUS',
  SESSION_EVENT: 'SESSION_EVENT',
} as const;

export const WEBSOCKET_INTERNAL_EVENTS = {
  SESSION_EVENT: 'SESSION_EVENT',
} as const;

export const websocketConfig = {
  namespace: () => process.env.WS_NAMESPACE ?? '/events',
  corsOrigins: () => corsConfig.allowedOrigins(),
  systemStatusIntervalMs: () =>
    parsePositiveNumber(process.env.WS_SYSTEM_STATUS_INTERVAL_MS, 60000),
};
