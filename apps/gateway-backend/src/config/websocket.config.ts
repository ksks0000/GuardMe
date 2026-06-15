import { corsConfig } from './cors.config';

function parsePositiveNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value);
  const safeDefault = Number.isFinite(defaultValue) && defaultValue > 0 ? defaultValue : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : safeDefault;
}

export const WEBSOCKET_CLIENT_EVENTS = {
  TRAFFIC_LOG: 'TRAFFIC_LOG',
  SECURITY_EVENT: 'SECURITY_EVENT',
  SYSTEM_STATUS: 'SYSTEM_STATUS',
  SESSION_EVENT: 'SESSION_EVENT',
} as const;

export type WebSocketClientEvent =
  (typeof WEBSOCKET_CLIENT_EVENTS)[keyof typeof WEBSOCKET_CLIENT_EVENTS];

export const WEBSOCKET_INTERNAL_EVENTS = {
  SESSION_EVENT: 'SESSION_EVENT',
} as const;

export const websocketConfig = {
  namespace: () => process.env.WS_NAMESPACE ?? '/events',
  corsOrigins: () => corsConfig.allowedOrigins(),
  systemStatusIntervalMs: () =>
    parsePositiveNumber(process.env.WS_SYSTEM_STATUS_INTERVAL_MS, 60000),
};
