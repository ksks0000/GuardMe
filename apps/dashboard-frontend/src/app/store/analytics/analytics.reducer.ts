import { createFeature, createReducer, on } from '@ngrx/store';
import { AnalyticsSummary, AnalyticsSummaryQuery, SystemStatus } from '../../core/models';
import { AnalyticsActions } from './analytics.actions';

export interface AnalyticsState {
  summary: AnalyticsSummary | null;
  systemStatus: SystemStatus | null;
  lastQuery: AnalyticsSummaryQuery | null;
  loading: boolean;
  error: string | null;
}

export const initialAnalyticsState: AnalyticsState = {
  summary: null,
  systemStatus: null,
  lastQuery: null,
  loading: false,
  error: null,
};

export const analyticsFeature = createFeature({
  name: 'analytics',
  reducer: createReducer(
    initialAnalyticsState,
    on(AnalyticsActions.loadSummary, (state, { query }) => ({
      ...state,
      loading: true,
      error: null,
      lastQuery: query,
    })),
    on(AnalyticsActions.loadSummarySuccess, (state, { summary, systemStatus }) => ({
      ...state,
      loading: false,
      summary,
      systemStatus,
      error: null,
    })),
    on(AnalyticsActions.loadSummaryFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
  ),
});

export const {
  name: analyticsFeatureKey,
  reducer: analyticsReducer,
  selectAnalyticsState,
  selectSummary,
  selectSystemStatus,
  selectLastQuery,
  selectLoading,
  selectError,
} = analyticsFeature;
