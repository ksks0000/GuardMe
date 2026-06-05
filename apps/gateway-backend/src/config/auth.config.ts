function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  return value === undefined
    ? defaultValue
    : value.toLowerCase() === 'true';
}

export const authConfig = {
  jwtSecret: () => requireEnv('JWT_SECRET'),
  jwtExpiresIn: () => process.env.JWT_EXPIRES_IN ?? '15m',
  cookieName: () => process.env.COOKIE_NAME ?? 'gateway_access_token',
  cookieSecure: () => 
    parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  cookieSameSite: () =>
    (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ?? 'lax',
  cookieDomain: () => process.env.COOKIE_DOMAIN || undefined,
  cookiePath: () => process.env.COOKIE_PATH ?? '/',
  sessionFingerprintStrict: () =>
    parseBoolean(process.env.SESSION_FINGERPRINT_STRICT, true),
  reAuthTimeoutMinutes: () =>
    Number(process.env.REAUTH_TIMEOUT_MINUTES ?? 15),
};
