function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value ?? defaultValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export const throttleConfig = {
  ttlMs: () => parsePositiveInt(process.env.THROTTLE_TTL_MS, 60_000),
  // General API limit per IP per window
  limit: () => parsePositiveInt(process.env.THROTTLE_LIMIT, 100),
  // Stricter limit for credential endpoints (login/register)
  authLimit: () => parsePositiveInt(process.env.THROTTLE_AUTH_LIMIT, 5),
};
