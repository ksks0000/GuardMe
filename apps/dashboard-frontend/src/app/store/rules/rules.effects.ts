import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { RulesApi } from '../../core/api/rules.api';
import { mapRulesError } from '../../core/utils/rules-error.util';
import { RulesActions } from './rules.actions';

@Injectable()
export class RulesEffects {
  private readonly actions$ = inject(Actions);
  private readonly rulesApi = inject(RulesApi);

  readonly loadRules$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RulesActions.loadRules),
      switchMap(() =>
        this.rulesApi.list().pipe(
          map(({ systemRules, userRules }) =>
            RulesActions.loadRulesSuccess({ systemRules, userRules }),
          ),
          catchError((error) =>
            of(RulesActions.loadRulesFailure({ error: mapRulesError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly createRule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RulesActions.createRule),
      switchMap(({ input }) =>
        this.rulesApi.create(input).pipe(
          map((rule) => RulesActions.createRuleSuccess({ rule })),
          catchError((error) =>
            of(RulesActions.createRuleFailure({ error: mapRulesError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly updateRule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RulesActions.updateRule),
      switchMap(({ id, input }) =>
        this.rulesApi.update(id, input).pipe(
          map((rule) => RulesActions.updateRuleSuccess({ rule })),
          catchError((error) =>
            of(RulesActions.updateRuleFailure({ error: mapRulesError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly deleteRule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RulesActions.deleteRule),
      switchMap(({ id }) =>
        this.rulesApi.delete(id).pipe(
          map(() => RulesActions.deleteRuleSuccess({ id })),
          catchError((error) =>
            of(RulesActions.deleteRuleFailure({ error: mapRulesError(error) })),
          ),
        ),
      ),
    ),
  );
}
