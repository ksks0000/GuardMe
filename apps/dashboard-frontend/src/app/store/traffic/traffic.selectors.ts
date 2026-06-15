import { createFeatureSelector, createSelector } from '@ngrx/store';
import { THREAT_VERDICTS } from '../../core/models';
import {
  countAllowedTrafficLogs,
  countBlockedTrafficLogs,
} from '../../core/utils/traffic-stats.util';
import { normalizeTrafficVerdict } from '../../core/utils/traffic-verdict.util';
import { trafficAdapter, trafficFeatureKey, TrafficState } from './traffic.reducer';

export const selectTrafficState = createFeatureSelector<TrafficState>(trafficFeatureKey);

const adapterSelectors = trafficAdapter.getSelectors(selectTrafficState);

export const selectAllTrafficLogs = adapterSelectors.selectAll;
export const selectTrafficEntities = adapterSelectors.selectEntities;
export const selectTrafficTotal = adapterSelectors.selectTotal;

export interface TrafficVerdictStats {
  safe: number;
  suspicious: number;
  malicious: number;
  unverified: number;
  total: number;
}

export const selectTrafficVerdictStats = createSelector(selectAllTrafficLogs, (logs): TrafficVerdictStats =>
  logs.reduce(
    (stats, log) => {
      stats.total += 1;
      switch (normalizeTrafficVerdict(log.verdict)) {
        case THREAT_VERDICTS.SAFE:
          stats.safe += 1;
          break;
        case THREAT_VERDICTS.SUSPICIOUS:
          stats.suspicious += 1;
          break;
        case THREAT_VERDICTS.MALICIOUS:
          stats.malicious += 1;
          break;
        case THREAT_VERDICTS.UNVERIFIED:
          stats.unverified += 1;
          break;
      }
      return stats;
    },
    { safe: 0, suspicious: 0, malicious: 0, unverified: 0, total: 0 },
  ),
);

export const selectAllowedCount = createSelector(selectAllTrafficLogs, (logs) =>
  countAllowedTrafficLogs(logs),
);

export const selectBlockedCount = createSelector(selectAllTrafficLogs, (logs) =>
  countBlockedTrafficLogs(logs),
);
