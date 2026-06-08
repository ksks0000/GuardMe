export interface TrafficLogInput {
  userId: string;
  clientIp: string;
  url: string;
  destinationHost: string;
  destinationPort?: number | null;
  destinationIp?: string | null;
  method: string;
  verdict: string;
  riskScore: number;
  timestamp?: Date;
}
