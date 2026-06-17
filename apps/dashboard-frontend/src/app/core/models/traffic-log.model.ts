export const THREAT_VERDICTS = {
  SAFE: 'SAFE',
  SUSPICIOUS: 'SUSPICIOUS',
  MALICIOUS: 'MALICIOUS',
  UNVERIFIED: 'UNVERIFIED',
} as const;

export type ThreatVerdict = (typeof THREAT_VERDICTS)[keyof typeof THREAT_VERDICTS];

export const POLICY_DECISIONS = {
  ALLOW: 'ALLOW',
  BLOCK: 'BLOCK',
  WARN: 'WARN',
} as const;

export type PolicyDecision = (typeof POLICY_DECISIONS)[keyof typeof POLICY_DECISIONS];

/* Mirrors backend TrafficLogPayload / WS TRAFFIC_LOG event */
export interface TrafficLog {
  id: string;
  userId: string;
  clientIp: string;
  url: string;
  destinationHost: string;
  destinationPort: number | null;
  destinationIp: string | null;
  method: string;
  policyDecision: string;
  threatVerdict: string;
  matchedRuleId: string | null;
  riskScore: number;
  timestamp: string;
}
