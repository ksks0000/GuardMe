// Shape of the JSON snapshot stored in behavior_baselines.snapshot

export interface AverageWithStdDev {
  average: number;
  stdDev: number;
}

export interface HostFrequency {
  host: string;
  count: number;
}

export interface SessionBaseline {
  count: number;
  averageDurationMinutes: number;
}

export interface BehaviorBaselineSnapshot {
  computedAt: string;
  windowDays: number;
  sampleSize: number;

  // Requests per hour-of-day, index 0-23 (local server time)
  activeHours: number[];
  // Hours holding at least 5% of all requests, sorted by activity
  mostActiveHours: number[];

  // Over every hour in the window (idle hours included)
  requestsPerHour: AverageWithStdDev;
  // Over hours that had at least one request — better spike reference 
  requestsPerActiveHour: AverageWithStdDev;
  requestsPerDay: AverageWithStdDev;
  blockedPerDay: { average: number };

  policyDecisions: Record<string, number>;
  threatVerdicts: Record<string, number>;
  methodDistribution: Record<string, number>;
  portDistribution: Record<string, number>;

  topHosts: HostFrequency[];
  // All distinct hosts seen in the window (capped) — for new-host detection
  knownHosts: string[];
  uniqueHostsPerDay: { median: number };

  riskScore: { average: number; max: number };
  // Share of POST/PUT requests (upload activity)
  uploadShare: number;
  downloadRequestsPerDay: { average: number };

  sessions: SessionBaseline;
  // Browser family counts derived from session user agents
  browsers: Record<string, number>;
}

export type BaselineStatus = 'ready' | 'insufficient_data';

export interface BaselinePayload {
  status: BaselineStatus;
  sampleSize: number;
  minSampleSize: number;
  windowDays: number;
  updatedAt: string | null;
  snapshot: BehaviorBaselineSnapshot | null;
}
