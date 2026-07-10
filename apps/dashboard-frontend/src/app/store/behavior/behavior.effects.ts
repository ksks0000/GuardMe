import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { UebaApi } from '../../core/api/ueba.api';
import { BehaviorActions } from './behavior.actions';

@Injectable()
export class BehaviorEffects {
  private readonly actions$ = inject(Actions);
  private readonly uebaApi = inject(UebaApi);

  readonly loadBaseline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BehaviorActions.loadBaseline),
      switchMap(() =>
        this.uebaApi.getBaseline().pipe(
          map((baseline) => BehaviorActions.loadBaselineSuccess({ baseline })),
          catchError(() =>
            of(
              BehaviorActions.loadBaselineFailure({
                error: 'Failed to load behavior baseline.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly loadPeriod$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BehaviorActions.loadPeriod),
      switchMap(({ query }) =>
        this.uebaApi.getAnomalies(query).pipe(
          map((anomalies) => BehaviorActions.loadPeriodSuccess({ anomalies })),
          catchError(() =>
            of(
              BehaviorActions.loadPeriodFailure({
                error: 'Failed to load period insights. Please try again.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly refreshBaseline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BehaviorActions.refreshBaseline),
      switchMap(() =>
        this.uebaApi.refreshBaseline().pipe(
          map((baseline) => BehaviorActions.refreshBaselineSuccess({ baseline })),
          catchError(() =>
            of(
              BehaviorActions.refreshBaselineFailure({
                error: 'Failed to refresh behavior baseline. Please try again.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
