import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { ThreatNotification } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { NotificationsActions } from './notifications.actions';

export const MAX_NOTIFICATIONS = 50;

export const notificationsAdapter = createEntityAdapter<ThreatNotification>({
  selectId: (notification) => notification.id,
  sortComparer: (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
});

export type NotificationsState = EntityState<ThreatNotification>;

export const initialNotificationsState: NotificationsState =
  notificationsAdapter.getInitialState();

export const notificationsFeatureKey = 'notifications';

function trimExcess(state: NotificationsState): NotificationsState {
  const excess = state.ids.length - MAX_NOTIFICATIONS;
  if (excess <= 0) {
    return state;
  }

  const idsToRemove = state.ids.slice(MAX_NOTIFICATIONS) as string[];
  return notificationsAdapter.removeMany(idsToRemove, state);
}

export const notificationsReducer = createReducer(
  initialNotificationsState,

  on(NotificationsActions.upsertNotification, (state, { notification }) => {
    const existing = state.entities[notification.id];
    const next: ThreatNotification = {
      ...notification,
      read: existing?.read ?? false,
      dismissed: existing?.dismissed ?? false,
    };

    return trimExcess(notificationsAdapter.upsertOne(next, state));
  }),

  on(NotificationsActions.markRead, (state, { id }) =>
    notificationsAdapter.updateOne({ id, changes: { read: true } }, state),
  ),

  on(NotificationsActions.markAllRead, (state) => {
    const updates = state.ids.map((id) => ({
      id: id as string,
      changes: { read: true },
    }));
    return notificationsAdapter.updateMany(updates, state);
  }),

  on(NotificationsActions.dismissNotification, (state, { id }) =>
    notificationsAdapter.updateOne({ id, changes: { dismissed: true } }, state),
  ),

  on(
    NotificationsActions.clearNotifications,
    AuthActions.logoutSuccess,
    AuthActions.sessionExpired,
    () => initialNotificationsState,
  ),
);
