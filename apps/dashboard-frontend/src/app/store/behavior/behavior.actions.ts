import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BehaviorBaselinePayload, UebaAnomaliesPayload, UebaAnomaliesQuery } from '../../core/models';

export const BehaviorActions = createActionGroup({
  source: 'Behavior',
  events: {
    'Load Baseline': emptyProps(),
    'Load Baseline Success': props<{ baseline: BehaviorBaselinePayload }>(),
    'Load Baseline Failure': props<{ error: string }>(),
    'Load Period': props<{ query: UebaAnomaliesQuery }>(),
    'Load Period Success': props<{ anomalies: UebaAnomaliesPayload }>(),
    'Load Period Failure': props<{ error: string }>(),
    'Refresh Baseline': emptyProps(),
    'Refresh Baseline Success': props<{ baseline: BehaviorBaselinePayload }>(),
    'Refresh Baseline Failure': props<{ error: string }>(),
    'Clear Error': emptyProps(),
  },
});
