import {
  POLICY_DECISIONS,
  PolicyDecision,
  SIEM_EVENT_SEVERITIES,
  SIEM_EVENT_TYPES,
  SiemEventSeverity,
  THREAT_VERDICTS,
  ThreatVerdict,
} from '../models';

export interface AnalyticsChartSegment {
  key: string;
  label: string;
  value: number;
  cssClass: string;
}

const POLICY_DECISION_CHART_CONFIG: Array<{
  key: PolicyDecision;
  label: string;
  cssClass: string;
}> = [
  { key: POLICY_DECISIONS.ALLOW, label: 'Allow', cssClass: 'safe' },
  { key: POLICY_DECISIONS.WARN, label: 'Warn', cssClass: 'suspicious' },
  { key: POLICY_DECISIONS.BLOCK, label: 'Block', cssClass: 'malicious' },
];

const THREAT_VERDICT_CHART_CONFIG: Array<{
  key: ThreatVerdict;
  label: string;
  cssClass: string;
}> = [
  { key: THREAT_VERDICTS.SAFE, label: 'Safe', cssClass: 'safe' },
  { key: THREAT_VERDICTS.SUSPICIOUS, label: 'Suspicious', cssClass: 'suspicious' },
  { key: THREAT_VERDICTS.MALICIOUS, label: 'Malicious', cssClass: 'malicious' },
  { key: THREAT_VERDICTS.UNVERIFIED, label: 'Unverified', cssClass: 'unverified' },
];

const SECURITY_EVENT_TYPE_LABELS: Record<string, string> = {
  [SIEM_EVENT_TYPES.AUTH_FAILURE]: 'Auth failure',
  [SIEM_EVENT_TYPES.SESSION_REVOKED]: 'Session revoked',
  [SIEM_EVENT_TYPES.FINGERPRINT_MISMATCH]: 'Fingerprint mismatch',
  [SIEM_EVENT_TYPES.REAUTH_REQUIRED]: 'Re-auth required',
  [SIEM_EVENT_TYPES.REAUTH_FAILURE]: 'Re-auth failure',
  [SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE]: 'Threat scan failure',
  [SIEM_EVENT_TYPES.THREAT_SCAN_TIMEOUT]: 'Threat scan timeout',
  [SIEM_EVENT_TYPES.MALICIOUS_BLOCKED]: 'Malicious blocked',
  [SIEM_EVENT_TYPES.RULE_MATCH]: 'Rule match',
  [SIEM_EVENT_TYPES.SUSPICIOUS_PROCEED]: 'Suspicious proceed',
  [SIEM_EVENT_TYPES.PROXY_ERROR]: 'Proxy error',
  [SIEM_EVENT_TYPES.VAULT_UNLOCKED]: 'Vault unlocked',
  [SIEM_EVENT_TYPES.VAULT_UNLOCK_FAILURE]: 'Vault unlock failure',
};

const SECURITY_SEVERITY_CHART_CONFIG: Array<{
  key: SiemEventSeverity;
  label: string;
  cssClass: string;
}> = [
  { key: SIEM_EVENT_SEVERITIES.LOW, label: 'Low', cssClass: 'low' },
  { key: SIEM_EVENT_SEVERITIES.MEDIUM, label: 'Medium', cssClass: 'medium' },
  { key: SIEM_EVENT_SEVERITIES.HIGH, label: 'High', cssClass: 'high' },
  { key: SIEM_EVENT_SEVERITIES.CRITICAL, label: 'Critical', cssClass: 'critical' },
];

function buildChartSeries<T extends string>(
  counts: Record<string, number>,
  config: Array<{ key: T; label: string; cssClass: string }>,
): AnalyticsChartSegment[] {
  const series: AnalyticsChartSegment[] = [];

  config.forEach((item) => {
    series.push({
      key: item.key,
      label: item.label,
      value: counts[item.key] ?? 0,
      cssClass: item.cssClass,
    });
  });

  return series;
}

export function buildPolicyDecisionSeries(
  counts: Record<PolicyDecision, number>,
): AnalyticsChartSegment[] {
  return buildChartSeries(counts, POLICY_DECISION_CHART_CONFIG);
}

export function buildThreatVerdictSeries(
  counts: Record<ThreatVerdict, number>,
): AnalyticsChartSegment[] {
  return buildChartSeries(counts, THREAT_VERDICT_CHART_CONFIG);
}

export function buildSecuritySeveritySeries(
  counts: Record<string, number>,
): AnalyticsChartSegment[] {
  return buildChartSeries(counts, SECURITY_SEVERITY_CHART_CONFIG);
}

export function buildSecurityEventTypeSeries(
  counts: Record<string, number>,
): AnalyticsChartSegment[] {
  const config = Object.values(SIEM_EVENT_TYPES).map((type) => ({
    key: type,
    label: SECURITY_EVENT_TYPE_LABELS[type] ?? type,
    cssClass: 'default',
  }));

  return buildChartSeries(counts, config).sort((left, right) => {
    if (right.value !== left.value) {
      return right.value - left.value;
    }

    return left.label.localeCompare(right.label);
  });
}

function niceAxisStep(maxValue: number, targetTicks: number): number {
  if (maxValue <= 0) {
    return 1;
  }

  const rough = maxValue / Math.max(targetTicks - 1, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;

  let nice = 10;
  if (normalized <= 1) {
    nice = 1;
  } else if (normalized <= 2) {
    nice = 2;
  } else if (normalized <= 5) {
    nice = 5;
  }

  return nice * magnitude;
}

// Top of the Y-axis scale
export function timeChartYAxisCeiling(maxRequestCount: number): number {
  const ticks = buildTimeChartYAxisTicks(maxRequestCount);
  return ticks.at(-1) ?? 0;
}

export function buildTimeChartYAxisTicks(maxRequestCount: number): number[] {
  if (maxRequestCount <= 0) {
    return [0];
  }

  const step = niceAxisStep(maxRequestCount, 5);
  const ceiling = Math.ceil(maxRequestCount / step) * step;
  const ticks: number[] = [];

  for (let value = 0; value <= ceiling; value += step) {
    ticks.push(value);
  }

  return ticks;
}

export function chartSegmentWidthPercent(
  segment: AnalyticsChartSegment,
  total: number,
): number {
  if (total <= 0 || segment.value <= 0) {
    return 0;
  }

  return Math.max((segment.value / total) * 100, 2);
}

export function timeBucketHeightPercent(
  requestCount: number,
  axisCeiling: number,
): number {
  if (axisCeiling <= 0 || requestCount <= 0) {
    return 0;
  }

  return (requestCount / axisCeiling) * 100;
}

export function blockedSharePercent(requestCount: number, blockedCount: number): number {
  if (requestCount <= 0 || blockedCount <= 0) {
    return 0;
  }

  return Math.min((blockedCount / requestCount) * 100, 100);
}
