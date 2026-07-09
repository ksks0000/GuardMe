import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ThreatNotificationPayload } from '../../core/models';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Upsert Notification': props<{ notification: ThreatNotificationPayload }>(),
    'Mark Read': props<{ id: string }>(),
    'Mark All Read': emptyProps(),
    'Dismiss Notification': props<{ id: string }>(),
    'Clear Notifications': emptyProps(),
  },
});
