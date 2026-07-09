// Internal events for UEBA (NestJS EventEmitter)
export const DOMAIN_EVENTS = {
  TRAFFIC_LOG_CREATED: 'traffic.log.created',
  SECURITY_EVENT_CREATED: 'security.event.created',
  UEBA_ANOMALY_DETECTED: 'ueba.anomaly.detected',
} as const;

export type DomainEventName =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];
