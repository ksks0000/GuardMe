import { PolicyDecision } from '../../proxy/dto/policy-decision.enum';
import { ThreatVerdict } from '../../threat/dto/threat-verdict.enum';
import { AnalyticsBucketHours } from './analytics-summary-query.dto';

export interface AnalyticsPeriodPayload {
  from: string;
  to: string;
  bucketHours: AnalyticsBucketHours;
}

export interface AnalyticsRiskStatsPayload {
  average: number;
  max: number;
  highRiskCount: number;
}

export interface AnalyticsTopHostPayload {
  host: string;
  count: number;
}

export interface AnalyticsTimeBucketPayload {
  bucketStart: string;
  requestCount: number;
  blockedCount: number;
}

export interface AnalyticsTrafficSummaryPayload {
  totalRequests: number;
  byPolicyDecision: Record<PolicyDecision, number>;
  byThreatVerdict: Record<ThreatVerdict, number>;
  risk: AnalyticsRiskStatsPayload;
  topDestinationHosts: AnalyticsTopHostPayload[];
  timeBuckets: AnalyticsTimeBucketPayload[];
}

export interface AnalyticsSecurityEventsSummaryPayload {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface AnalyticsSummaryPayload {
  period: AnalyticsPeriodPayload;
  traffic: AnalyticsTrafficSummaryPayload;
  securityEvents: AnalyticsSecurityEventsSummaryPayload;
}
