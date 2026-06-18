import { PolicyDecision, ThreatVerdict } from './traffic-log.model';

export type AnalyticsBucketHours = 1 | 6 | 24;

export interface AnalyticsSummaryQuery {
  from?: string;
  to?: string;
  bucketHours?: AnalyticsBucketHours;
}

export interface AnalyticsPeriod {
  from: string;
  to: string;
  bucketHours: AnalyticsBucketHours;
}

export interface AnalyticsRiskStats {
  average: number;
  max: number;
  highRiskCount: number;
}

export interface AnalyticsTopHost {
  host: string;
  count: number;
}

export interface AnalyticsTimeBucket {
  bucketStart: string;
  requestCount: number;
  blockedCount: number;
}

export interface AnalyticsTrafficSummary {
  totalRequests: number;
  byPolicyDecision: Record<PolicyDecision, number>;
  byThreatVerdict: Record<ThreatVerdict, number>;
  risk: AnalyticsRiskStats;
  topDestinationHosts: AnalyticsTopHost[];
  timeBuckets: AnalyticsTimeBucket[];
}

export interface AnalyticsSecurityEventsSummary {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

// Mirrors backend AnalyticsSummaryPayload 
export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  traffic: AnalyticsTrafficSummary;
  securityEvents: AnalyticsSecurityEventsSummary;
}
