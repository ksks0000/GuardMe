import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, take, takeUntil, tap } from 'rxjs';
import { RealtimeApi } from '../../core/api/realtime.api';
import { SIEM_EVENT_SEVERITIES, ThreatNotificationPayload } from '../../core/models';
import { buildNotificationNavigationTarget } from '../../core/utils/notification-navigation.util';
import { AUTH_END_EVENTS, AUTH_START_EVENTS } from '../auth/auth-lifecycle.events';
import { NotificationsActions } from './notifications.actions';

const TOAST_SEVERITIES: ReadonlySet<string> = new Set([
  SIEM_EVENT_SEVERITIES.HIGH,
  SIEM_EVENT_SEVERITIES.CRITICAL,
]);

@Injectable()
export class NotificationsEffects {
  private readonly actions$ = inject(Actions);
  private readonly realtimeApi = inject(RealtimeApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly streamThreatNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(...AUTH_START_EVENTS),
      switchMap(() =>
        this.realtimeApi.threatNotifications$.pipe(
          tap((notification) => this.maybeShowHighSeverityToast(notification)),
          map((notification) =>
            NotificationsActions.upsertNotification({ notification }),
          ),
          takeUntil(this.actions$.pipe(ofType(...AUTH_END_EVENTS))),
        ),
      ),
    ),
  );

  private maybeShowHighSeverityToast(notification: ThreatNotificationPayload): void {
    if (!TOAST_SEVERITIES.has(notification.severity)) {
      return;
    }

    const ref = this.snackBar.open(
      `${notification.title}: ${notification.message}`,
      'View',
      {
        duration: 8000,
        panelClass: [
          'threat-snackbar',
          `threat-snackbar--${notification.severity.toLowerCase()}`,
        ],
      },
    );

    ref.onAction().pipe(take(1)).subscribe(() => {
      const target = buildNotificationNavigationTarget(notification);
      void this.router.navigate(target.path, { queryParams: target.queryParams });
    });
  }
}
