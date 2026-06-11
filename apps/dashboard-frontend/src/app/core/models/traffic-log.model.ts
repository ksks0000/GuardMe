export const THREAT_VERDICTS = {
  SAFE: 'SAFE',
  SUSPICIOUS: 'SUSPICIOUS',
  MALICIOUS: 'MALICIOUS',
  UNVERIFIED: 'UNVERIFIED',
} as const;

export type ThreatVerdict = (typeof THREAT_VERDICTS)[keyof typeof THREAT_VERDICTS];

/* Mirrors backend TrafficLogPayload / WS TRAFFIC_LOG event */
export interface TrafficLog {
  id: string;
  userId: string;
  clientIp: string;
  url: string;
  destinationHost: string;
  destinationPort: number | null;
  method: string;
  verdict: string;
  riskScore: number;
  timestamp: string;
}
