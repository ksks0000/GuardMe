import { createSelector } from '@ngrx/store';
import {
  buildPolicyDecisionSeries,
  buildSecurityEventTypeSeries,
  buildSecuritySeveritySeries,
  buildThreatVerdictSeries,
} from '../../core/utils/analytics-chart.util';
import {
  selectError,
  selectLoading,
  selectSummary,
  selectSystemStatus,
} from './analytics.reducer';

export {
  selectError as selectAnalyticsError,
  selectLoading as selectAnalyticsLoading,
  selectSummary as selectAnalyticsSummary,
  selectSystemStatus as selectAnalyticsSystemStatus,
} from './analytics.reducer';

export const selectPolicyDecisionSeries = createSelector(selectSummary, (summary) =>
  summary ? buildPolicyDecisionSeries(summary.traffic.byPolicyDecision) : [],
);

export const selectThreatVerdictSeries = createSelector(selectSummary, (summary) =>
  summary ? buildThreatVerdictSeries(summary.traffic.byThreatVerdict) : [],
);

export const selectSecuritySeveritySeries = createSelector(selectSummary, (summary) =>
  summary ? buildSecuritySeveritySeries(summary.securityEvents.bySeverity) : [],
);

export const selectSecurityEventTypeSeries = createSelector(selectSummary, (summary) =>
  summary ? buildSecurityEventTypeSeries(summary.securityEvents.byType) : [],
);

export const selectAnalyticsTrafficTotal = createSelector(
  selectSummary,
  (summary) => summary?.traffic.totalRequests ?? 0,
);

export const selectAnalyticsSecurityTotal = createSelector(
  selectSummary,
  (summary) => summary?.securityEvents.total ?? 0,
);

export const selectAnalyticsRiskStats = createSelector(
  selectSummary,
  (summary) => summary?.traffic.risk ?? { average: 0, max: 0, highRiskCount: 0 },
);

export const selectTopDestinationHosts = createSelector(
  selectSummary,
  (summary) => summary?.traffic.topDestinationHosts ?? [],
);

export const selectTimeBuckets = createSelector(
  selectSummary,
  (summary) => summary?.traffic.timeBuckets ?? [],
);

export const selectMaxTimeBucketRequests = createSelector(selectTimeBuckets, (buckets) =>
  buckets.reduce((max, bucket) => Math.max(max, bucket.requestCount), 0),
);

export const selectAnalyticsPeriod = createSelector(
  selectSummary,
  (summary) => summary?.period ?? null,
);
