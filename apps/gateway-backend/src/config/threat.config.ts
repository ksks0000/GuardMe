import { parsePositiveNumber } from './env.util';

export const threatConfig = {
  virusTotalApiKey: () => process.env.VIRUSTOTAL_API_KEY?.trim() ?? '',
  virusTotalApiBaseUrl: () =>
    process.env.VIRUSTOTAL_API_BASE_URL ?? 'https://www.virustotal.com/api/v3',
  scanTimeoutMs: () =>
    parsePositiveNumber(process.env.THREAT_SCAN_TIMEOUT_MS, 30000),
  scanPollIntervalMs: () =>
    parsePositiveNumber(process.env.THREAT_SCAN_POLL_INTERVAL_MS, 1500),
};
