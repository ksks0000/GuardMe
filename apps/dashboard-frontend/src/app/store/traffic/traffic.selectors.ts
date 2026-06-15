import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  computeTrafficPageStats,
  countAllowedTrafficLogs,
  countBlockedTrafficLogs,
} from '../../core/utils/traffic-stats.util';
import { trafficAdapter, trafficFeatureKey, TrafficState } from './traffic.reducer';

export const selectTrafficState = createFeatureSelector<TrafficState>(trafficFeatureKey);

const adapterSelectors = trafficAdapter.getSelectors(selectTrafficState);

export const selectAllTrafficLogs = adapterSelectors.selectAll;
export const selectTrafficEntities = adapterSelectors.selectEntities;
export const selectTrafficTotal = adapterSelectors.selectTotal;

export const selectTrafficVerdictStats = createSelector(
  selectAllTrafficLogs,
  (logs) => computeTrafficPageStats(logs),
);

export const selectAllowedCount = createSelector(selectAllTrafficLogs, (logs) =>
  countAllowedTrafficLogs(logs),
);

export const selectBlockedCount = createSelector(selectAllTrafficLogs, (logs) =>
  countBlockedTrafficLogs(logs),
);
