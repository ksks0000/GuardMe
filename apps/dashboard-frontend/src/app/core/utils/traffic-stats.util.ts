import { THREAT_VERDICTS, TrafficLog } from '../models';
import {
  isAllowedTrafficVerdict,
  isBlockedTrafficVerdict,
  normalizeTrafficVerdict,
} from './traffic-verdict.util';

export interface TrafficPageStats {
  safe: number;
  suspicious: number;
  malicious: number;
  unverified: number;
  total: number;
}

export function computeTrafficPageStats(items: TrafficLog[]): TrafficPageStats {
  return items.reduce(
    (stats, log) => {
      stats.total += 1;
      switch (normalizeTrafficVerdict(log.verdict)) {
        case THREAT_VERDICTS.SAFE:
          stats.safe += 1;
          break;
        case THREAT_VERDICTS.SUSPICIOUS:
          stats.suspicious += 1;
          break;
        case THREAT_VERDICTS.MALICIOUS:
          stats.malicious += 1;
          break;
        case THREAT_VERDICTS.UNVERIFIED:
          stats.unverified += 1;
          break;
      }
      return stats;
    },
    { safe: 0, suspicious: 0, malicious: 0, unverified: 0, total: 0 },
  );
}

export function countAllowedTrafficLogs(logs: TrafficLog[]): number {
  return logs.filter((log) => isAllowedTrafficVerdict(log.verdict)).length;
}

export function countBlockedTrafficLogs(logs: TrafficLog[]): number {
  return logs.filter((log) => isBlockedTrafficVerdict(log.verdict)).length;
}
