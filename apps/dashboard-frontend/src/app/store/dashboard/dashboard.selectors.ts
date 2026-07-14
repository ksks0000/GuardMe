import { createSelector } from '@ngrx/store';
import { ActivityItem } from '../../core/models';
import { selectAllSecurityEvents } from '../security-events/security-events.selectors';
import { selectAllTrafficLogs } from '../traffic/traffic.selectors';

export const selectActivityFeed = createSelector(
  selectAllTrafficLogs,
  selectAllSecurityEvents,
  (trafficLogs, securityEvents): ActivityItem[] => {
    const trafficItems: ActivityItem[] = trafficLogs.map((log) => ({
      kind: 'traffic',
      id: `traffic:${log.id}`,
      timestamp: log.timestamp,
      data: log,
    }));

    const securityItems: ActivityItem[] = securityEvents.map((event) => ({
      kind: 'security',
      id: `security:${event.id}`,
      timestamp: event.createdAt,
      data: event,
    }));

    return [...trafficItems, ...securityItems].sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
    );
  },
);
