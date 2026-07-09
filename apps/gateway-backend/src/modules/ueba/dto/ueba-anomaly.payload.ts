import { AnomalyResult } from './anomaly-result';

export interface UebaAnomalyPayload {
  userId: string;
  trafficLogId: string;
  destinationHost: string;
  timestamp: string;
  result: AnomalyResult;
}
