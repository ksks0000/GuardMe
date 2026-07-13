import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { merge } from 'rxjs';
import { map, mergeMap, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { RealtimeApi } from '../../core/api/realtime.api';
import { SecurityEvent, TrafficLog } from '../../core/models';
import { AUTH_END_EVENTS, AUTH_START_EVENTS } from '../auth/auth-lifecycle.events';
import { SecurityEventsActions } from '../security-events/security-events.actions';
import { selectSecurityEventEntities } from '../security-events/security-events.selectors';
import { SystemStatusActions } from '../system-status/system-status.actions';
import { NotificationsActions } from '../notifications/notifications.actions';
import { TrafficActions } from '../traffic/traffic.actions';
import { selectTrafficEntities } from '../traffic/traffic.selectors';

@Injectable()
export class RealtimeEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly realtimeApi = inject(RealtimeApi);

  readonly connectOnAuth$ = createEffect(() =>
      this.actions$.pipe(
        ofType(...AUTH_START_EVENTS),
        tap(() => this.realtimeApi.connect()),
      ),
    { dispatch: false },
  );

  readonly disconnectOnLogout$ = createEffect(() =>
      this.actions$.pipe(
        ofType(...AUTH_END_EVENTS),
        tap(() => this.realtimeApi.disconnect()),
      ),
    { dispatch: false },
  );

  readonly streamEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(...AUTH_START_EVENTS),
      switchMap(() =>
        merge(
          this.realtimeApi.trafficLogs$.pipe(
            withLatestFrom(this.store.select(selectTrafficEntities)),
            map(([log, entities]) => this.toTrafficAction(log, entities)),
          ),
          this.realtimeApi.securityEvents$.pipe(
            withLatestFrom(this.store.select(selectSecurityEventEntities)),
            map(([event, entities]) => this.toSecurityAction(event, entities)),
          ),
        ).pipe(takeUntil(this.actions$.pipe(ofType(...AUTH_END_EVENTS)))),
      ),
    ),
  );

  readonly streamSystemStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(...AUTH_START_EVENTS),
      switchMap(() =>
        this.realtimeApi.systemStatus$.pipe(
          map((status) => SystemStatusActions.updateStatus({ status })),
          takeUntil(this.actions$.pipe(ofType(...AUTH_END_EVENTS))),
        ),
      ),
    ),
  );

  readonly clearRealtimeOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(...AUTH_END_EVENTS),
      mergeMap(() => [
        TrafficActions.clearLogs(),
        SecurityEventsActions.clearEvents(),
        SystemStatusActions.clearStatus(),
        NotificationsActions.clearNotifications(),
      ]),
    ),
  );

  private toTrafficAction(
    log: TrafficLog,
    entities: Record<string, TrafficLog | undefined>,
  ) {
    return entities[log.id]
      ? TrafficActions.updateLog({ log })
      : TrafficActions.insertLog({ log });
  }

  private toSecurityAction(
    event: SecurityEvent,
    entities: Record<string, SecurityEvent | undefined>,
  ) {
    return entities[event.id]
      ? SecurityEventsActions.updateEvent({ event })
      : SecurityEventsActions.insertEvent({ event });
  }
}
