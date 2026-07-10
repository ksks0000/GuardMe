import { UebaAnomalyTimelineBucket, UebaRiskTrendPoint } from '../models/ueba.model';
import { buildTimeChartYAxisTicks, timeBucketHeightPercent } from './analytics-chart.util';

export function formatHourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const date = new Date(Date.UTC(2000, 0, 1, normalized));
  return date.toLocaleTimeString(undefined, { hour: 'numeric' });
}

export function activeHourIntensity(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 0) {
    return 0.12;
  }

  return 0.12 + (count / maxCount) * 0.88;
}

export function maxTimelineCount(buckets: UebaAnomalyTimelineBucket[]): number {
  return buckets.reduce((max, bucket) => Math.max(max, bucket.count), 0);
}

export function maxRiskTrendAverage(points: UebaRiskTrendPoint[]): number {
  return points.reduce((max, point) => Math.max(max, point.averageRisk), 0);
}

export function timelineBucketHeight(count: number, axisCeiling: number): number {
  return timeBucketHeightPercent(count, axisCeiling);
}

export function riskTrendHeight(averageRisk: number, axisCeiling: number): number {
  return timeBucketHeightPercent(averageRisk, axisCeiling);
}

export function buildRiskTrendYAxisTicks(maxAverageRisk: number): number[] {
  return buildTimeChartYAxisTicks(maxAverageRisk);
}

export function formatInsightDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function anomalyTimelineTooltip(bucket: UebaAnomalyTimelineBucket): string {
  if (bucket.count === 0) {
    return 'No anomalies';
  }

  return `${bucket.count} anomal${bucket.count === 1 ? 'y' : 'ies'} · avg score ${bucket.averageScore}`;
}

export function riskTrendTooltip(point: UebaRiskTrendPoint): string {
  return `Avg risk ${point.averageRisk} · ${point.requestCount} requests`;
}
