import { SiemEventSeverity } from '../../../config/siem.config';

export interface UebaAnomalyItemPayload {
  id: string;
  createdAt: string;
  severity: SiemEventSeverity;
  message: string;
  anomalyScore: number;
  signals: string[];
  destinationHost: string | null;
  policyDecision: string | null;
  threatVerdict: string | null;
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
  items: UebaAnomalyItemPayload[];
  total: number;
  page: number;
  pageSize: number;
  timeline: UebaAnomalyTimelineBucket[];
  riskTrend: UebaRiskTrendPoint[];
}
