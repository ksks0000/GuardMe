import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, take, zip } from 'rxjs';
import { AnalyticsApi } from '../../core/api/analytics.api';
import { selectSystemStatus } from '../system-status/system-status.selectors';
import { AnalyticsActions } from './analytics.actions';

@Injectable()
export class AnalyticsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly analyticsApi = inject(AnalyticsApi);

  readonly loadSummary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadSummary),
      switchMap(({ query }) =>
        zip(
          this.analyticsApi.getSummary(query),
          this.store.select(selectSystemStatus).pipe(take(1)),
        ).pipe(
          map(([summary, systemStatus]) =>
            AnalyticsActions.loadSummarySuccess({ summary, systemStatus }),
          ),
          catchError(() =>
            of(
              AnalyticsActions.loadSummaryFailure({
                error: 'Failed to load analytics summary. Please try again.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
