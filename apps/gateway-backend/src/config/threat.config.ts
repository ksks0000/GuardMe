function parsePositiveNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value);
  const safeDefault = Number.isFinite(defaultValue) && defaultValue > 0 ? defaultValue : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : safeDefault;
}

export const threatConfig = {
  virusTotalApiKey: () => process.env.VIRUSTOTAL_API_KEY?.trim() ?? '',
  virusTotalApiBaseUrl: () =>
    process.env.VIRUSTOTAL_API_BASE_URL ?? 'https://www.virustotal.com/api/v3',
  scanTimeoutMs: () =>
    parsePositiveNumber(process.env.THREAT_SCAN_TIMEOUT_MS, 30000),
  scanPollIntervalMs: () =>
    parsePositiveNumber(process.env.THREAT_SCAN_POLL_INTERVAL_MS, 1500),
};
