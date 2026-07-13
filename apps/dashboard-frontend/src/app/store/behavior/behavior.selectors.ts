import { createSelector } from '@ngrx/store';
import { maxRiskTrendAverage, maxTimelineCount } from '../../core/utils/ueba-chart.util';
import { selectAnomalies } from './behavior.reducer';

export {
  selectBaseline as selectBehaviorBaseline,
  selectBaselineError as selectBehaviorBaselineError,
  selectBaselineLoading as selectBehaviorBaselineLoading,
  selectError as selectBehaviorError,
  selectPeriodLoading as selectBehaviorPeriodLoading,
} from './behavior.reducer';

export const selectBehaviorPeriod = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.period ?? null,
);

export const selectAnomalyTimeline = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.timeline ?? [],
);

export const selectRiskTrend = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.riskTrend ?? [],
);

export const selectAnomalyItems = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.items ?? [],
);

export const selectAnomalyTotal = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.total ?? 0,
);

export const selectAnomalyPage = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.page ?? 1,
);

export const selectAnomalyPageSize = createSelector(
  selectAnomalies,
  (anomalies) => anomalies?.pageSize ?? 15,
);

export const selectMaxAnomalyTimelineCount = createSelector(selectAnomalyTimeline, (timeline) =>
  maxTimelineCount(timeline),
);

export const selectMaxRiskTrendAverage = createSelector(selectRiskTrend, (riskTrend) =>
  maxRiskTrendAverage(riskTrend),
);

export const selectPeriodRequestCount = createSelector(selectRiskTrend, (points) =>
  points.reduce((sum, point) => sum + point.requestCount, 0),
);

export const selectPeriodAverageRisk = createSelector(selectRiskTrend, (points) => {
  let totalRisk = 0;
  let totalRequests = 0;

  for (const point of points) {
    totalRisk += point.averageRisk * point.requestCount;
    totalRequests += point.requestCount;
  }

  if (totalRequests <= 0) {
    return 0;
  }

  return Math.round((totalRisk / totalRequests) * 10) / 10;
});
