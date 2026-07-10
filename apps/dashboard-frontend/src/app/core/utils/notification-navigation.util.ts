import { SIEM_EVENT_TYPES } from '../models';
import { ThreatNotification } from '../models/threat-notification.model';

export interface NotificationNavigationTarget {
  path: string[];
  queryParams: Record<string, string | null>;
}

export function buildNotificationNavigationTarget(
  notification: Pick<ThreatNotification, 'type'>,
): NotificationNavigationTarget {
  if (notification.type === SIEM_EVENT_TYPES.ANOMALY_DETECTED) {
    return {
      path: ['/behavior'],
      queryParams: {},
    };
  }

  return {
    path: ['/security'],
    queryParams: {
      type: notification.type,
      severity: null,
      from: null,
      to: null,
    },
  };
}
