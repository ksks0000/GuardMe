import { parsePositiveNumber } from './env.util';

export type ThreatFailStrategy = 'open' | 'closed';

const MIN_POLL_SLEEP_MS = 100;

export const threatConfig = {
  virusTotalApiKey: () => process.env.VIRUSTOTAL_API_KEY?.trim() ?? '',
  virusTotalApiBaseUrl: () =>
    process.env.VIRUSTOTAL_API_BASE_URL ?? 'https://www.virustotal.com/api/v3',
  scanTimeoutMs: () =>
    parsePositiveNumber(process.env.THREAT_SCAN_TIMEOUT_MS, 30000),
  scanPollIntervalMs: () =>
    parsePositiveNumber(process.env.THREAT_SCAN_POLL_INTERVAL_MS, 1500),
  minPollSleepMs: () => MIN_POLL_SLEEP_MS,
  failStrategy: (): ThreatFailStrategy => {
    const value = process.env.THREAT_FAIL_STRATEGY?.trim().toLowerCase();
    return value === 'closed' ? 'closed' : 'open';
  },
  failClosed: () => threatConfig.failStrategy() === 'closed'
};
