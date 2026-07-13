import { UebaAnomalyTimelineBucket, UebaRiskTrendPoint } from '../models/ueba.model';

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

export function shouldShowChartLabel(index: number, total: number): boolean {
  if (total <= 14) return true;
  if (total <= 28) return index % 2 === 0;
  return index % 5 === 0 || index === total - 1;
}

export function anomalyScoreTier(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function severityIconName(severity: string): string {
  const map: Record<string, string> = {
    low: 'info_outline',
    medium: 'warning_amber',
    high: 'warning',
    critical: 'report',
  };
  return map[severity.toLowerCase()] ?? 'warning';
}
