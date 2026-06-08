function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value ?? defaultValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export const threatConfig = {
  virusTotalApiKey: () => process.env.VIRUSTOTAL_API_KEY?.trim() ?? '',
  virusTotalApiBaseUrl: () =>
    process.env.VIRUSTOTAL_API_BASE_URL ?? 'https://www.virustotal.com/api/v3',
  scanTimeoutMs: () =>
    parsePositiveInt(process.env.THREAT_SCAN_TIMEOUT_MS, 30000),
  scanPollIntervalMs: () =>
    parsePositiveInt(process.env.THREAT_SCAN_POLL_INTERVAL_MS, 1500),
};
