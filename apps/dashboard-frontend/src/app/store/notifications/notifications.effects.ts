import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import { RealtimeApi } from '../../core/api/realtime.api';
import { SIEM_EVENT_SEVERITIES } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { NotificationsActions } from './notifications.actions';
import { selectNotificationEntities } from './notifications.selectors';

const AUTH_END_EVENTS = [
  AuthActions.logoutSuccess,
  AuthActions.sessionExpired,
] as const;

const AUTH_START_EVENTS = [
  AuthActions.loginSuccess,
  AuthActions.loadProfileSuccess,
] as const;

const TOAST_SEVERITIES: ReadonlySet<string> = new Set([
  SIEM_EVENT_SEVERITIES.HIGH,
  SIEM_EVENT_SEVERITIES.CRITICAL,
]);

@Injectable()
export class NotificationsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly realtimeApi = inject(RealtimeApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly streamThreatNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(...AUTH_START_EVENTS),
      switchMap(() =>
        this.realtimeApi.threatNotifications$.pipe(
          map((notification) =>
            NotificationsActions.upsertNotification({ notification }),
          ),
          takeUntil(this.actions$.pipe(ofType(...AUTH_END_EVENTS))),
        ),
      ),
    ),
  );

  readonly showHighSeverityToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(NotificationsActions.upsertNotification),
        withLatestFrom(this.store.select(selectNotificationEntities)),
        filter(([{ notification }, entities]) => {
          if (entities[notification.id]) {
            return false;
          }
          return TOAST_SEVERITIES.has(notification.severity);
        }),
        tap(([{ notification }]) => {
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

          ref.onAction().subscribe(() => {
            void this.router.navigate(['/security'], {
              queryParams: {
                type: notification.type,
                severity: null,
                from: null,
                to: null,
              },
            });
          });
        }),
      ),
    { dispatch: false },
  );
}
