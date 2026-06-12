import { createFeatureSelector, createSelector } from '@ngrx/store';
import { systemStatusFeatureKey, SystemStatusState } from './system-status.reducer';

export const selectSystemStatusState =
  createFeatureSelector<SystemStatusState>(systemStatusFeatureKey);

export const selectSystemStatus = createSelector(
  selectSystemStatusState,
  (state) => state.current,
);

export const selectIsSystemHealthy = createSelector(selectSystemStatus, (status) => {
  if (!status) {
    return null;
  }

  return status.db === 'ok' && status.virusTotal === 'ok';
});
