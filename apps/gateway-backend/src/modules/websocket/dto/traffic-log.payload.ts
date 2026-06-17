export interface TrafficLogPayload {
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
