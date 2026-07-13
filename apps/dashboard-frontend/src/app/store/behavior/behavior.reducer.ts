import { createFeature, createReducer, on } from '@ngrx/store';
import { BehaviorBaselinePayload, UebaAnomaliesPayload, UebaAnomaliesQuery } from '../../core/models';
import { BehaviorActions } from './behavior.actions';

export interface BehaviorState {
  baseline: BehaviorBaselinePayload | null;
  anomalies: UebaAnomaliesPayload | null;
  lastQuery: UebaAnomaliesQuery | null;
  baselineLoading: boolean;
  periodLoading: boolean;
  error: string | null;
  baselineError: string | null;
}

export const initialBehaviorState: BehaviorState = {
  baseline: null,
  anomalies: null,
  lastQuery: null,
  baselineLoading: false,
  periodLoading: false,
  error: null,
  baselineError: null,
};

export const behaviorFeature = createFeature({
  name: 'behavior',
  reducer: createReducer(
    initialBehaviorState,
    on(BehaviorActions.loadBaseline, (state) => ({
      ...state,
      baselineLoading: true,
      baselineError: null,
    })),
    on(BehaviorActions.loadBaselineSuccess, (state, { baseline }) => ({
      ...state,
      baselineLoading: false,
      baseline,
      baselineError: null,
    })),
    on(BehaviorActions.loadBaselineFailure, (state, { error }) => ({
      ...state,
      baselineLoading: false,
      baselineError: error,
    })),
    on(BehaviorActions.loadPeriod, (state, { query }) => ({
      ...state,
      periodLoading: true,
      error: null,
      lastQuery: query,
    })),
    on(BehaviorActions.loadPeriodSuccess, (state, { anomalies }) => ({
      ...state,
      periodLoading: false,
      anomalies,
      error: null,
    })),
    on(BehaviorActions.loadPeriodFailure, (state, { error }) => ({
      ...state,
      periodLoading: false,
      error,
    })),
  ),
});

export const {
  name: behaviorFeatureKey,
  reducer: behaviorReducer,
  selectBehaviorState,
  selectBaseline,
  selectAnomalies,
  selectLastQuery,
  selectBaselineLoading,
  selectPeriodLoading,
  selectError,
  selectBaselineError,
} = behaviorFeature;
