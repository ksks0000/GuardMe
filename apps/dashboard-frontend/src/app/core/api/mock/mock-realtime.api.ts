import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  map,
  Observable,
  share,
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { RealtimeApi } from '../realtime.api';
import { SecurityEvent, SystemStatus, TrafficLog } from '../../models';
import { createSecurityEvent, createSystemStatus, createTrafficLog } from './mock-data.util';

@Injectable()
export class MockRealtimeApi extends RealtimeApi implements OnDestroy {
  private readonly active$ = new BehaviorSubject(false);
  private readonly destroy$ = new Subject<void>();

  readonly trafficLogs$: Observable<TrafficLog>;
  readonly securityEvents$: Observable<SecurityEvent>;
  readonly systemStatus$: Observable<SystemStatus>;

  constructor() {
    super();

    this.trafficLogs$ = this.gatedInterval(1500, 2500, () => createTrafficLog());
    this.securityEvents$ = this.gatedInterval(6000, 9000, () => createSecurityEvent());
    this.systemStatus$ = this.gatedInterval(0, 30_000, () => createSystemStatus());
  }

  connect(): void {
    this.active$.next(true);
  }

  disconnect(): void {
    this.active$.next(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.active$.complete();
  }

  private gatedInterval<T>(
    initialDelay: number,
    period: number,
    factory: () => T,
  ): Observable<T> {
    return this.active$.pipe(
      switchMap((active) =>
        active
          ? timer(initialDelay, period).pipe(
              map(factory),
              takeUntil(this.destroy$),
            )
          : EMPTY,
      ),
      share(),
    );
  }
}
