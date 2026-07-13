import { SiemEventSeverity } from './security-event.model';
import { PolicyDecision, ThreatVerdict } from './traffic-log.model';

export type BaselineStatus = 'ready' | 'insufficient_data';

export interface BehaviorBaselineSnapshot {
  computedAt: string;
  windowDays: number;
  sampleSize: number;
  activeHours: number[];
  mostActiveHours: number[];
  topHosts: Array<{ host: string; count: number }>;
  riskScore: { average: number; max: number };
}

export interface BehaviorBaselinePayload {
  status: BaselineStatus;
  sampleSize: number;
  minSampleSize: number;
  windowDays: number;
  updatedAt: string | null;
  snapshot: BehaviorBaselineSnapshot | null;
}

export interface UebaAnomalyItem {
  id: string;
  createdAt: string;
  severity: SiemEventSeverity;
  message: string;
  anomalyScore: number;
  signals: string[];
  destinationHost: string | null;
  policyDecision: PolicyDecision | string | null;
  threatVerdict: ThreatVerdict | string | null;
  riskScore: number | null;
}

export interface UebaAnomalyTimelineBucket {
  date: string;
  count: number;
  averageScore: number;
}

export interface UebaRiskTrendPoint {
  date: string;
  averageRisk: number;
  requestCount: number;
}

export interface UebaAnomaliesPayload {
  period: {
    from: string;
    to: string;
  };
  items: UebaAnomalyItem[];
  total: number;
  page: number;
  pageSize: number;
  timeline: UebaAnomalyTimelineBucket[];
  riskTrend: UebaRiskTrendPoint[];
}

export interface UebaAnomaliesQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
