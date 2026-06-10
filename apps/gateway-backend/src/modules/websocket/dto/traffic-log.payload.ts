export interface TrafficLogPayload {
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
