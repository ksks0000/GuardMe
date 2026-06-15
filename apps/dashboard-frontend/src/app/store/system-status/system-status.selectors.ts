import { createFeatureSelector, createSelector } from '@ngrx/store';
import { systemStatusFeatureKey, SystemStatusState } from './system-status.reducer';

export const selectSystemStatusState =
  createFeatureSelector<SystemStatusState>(systemStatusFeatureKey);

export const selectSystemStatus = createSelector(
  selectSystemStatusState,
  (state) => state.current,
);
