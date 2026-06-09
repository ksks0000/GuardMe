function parsePositiveNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value);
  const safeDefault = Number.isFinite(defaultValue) && defaultValue > 0 ? defaultValue : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : safeDefault;
}

export const proxyConfig = {
  port: () => parsePositiveNumber(process.env.PROXY_PORT, 8080),
  forwardTimeoutMs: () =>
    parsePositiveNumber(process.env.PROXY_FORWARD_TIMEOUT_MS, 30000),
  bypassTokenExpiresMinutes: () =>
    parsePositiveNumber(process.env.PROXY_BYPASS_TOKEN_MINUTES, 5),
  threatCacheTtlMs: () =>
    parsePositiveNumber(process.env.THREAT_CACHE_TTL_MS, 300000),
};
