import { createFeatureSelector, createSelector } from '@ngrx/store';
import { notificationsAdapter, NotificationsState, notificationsFeatureKey } from './notifications.reducer';

export const selectNotificationsState =
  createFeatureSelector<NotificationsState>(notificationsFeatureKey);

const adapterSelectors = notificationsAdapter.getSelectors(selectNotificationsState);

export const selectNotificationEntities = adapterSelectors.selectEntities;

export const selectAllNotifications = createSelector(
  adapterSelectors.selectAll,
  (notifications) => notifications.filter((notification) => !notification.dismissed),
);

export const selectUnreadNotificationCount = createSelector(
  selectAllNotifications,
  (notifications) => notifications.filter((notification) => !notification.read).length,
);
