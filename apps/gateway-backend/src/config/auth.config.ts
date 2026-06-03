function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const authConfig = {
  jwtSecret: () => requireEnv('JWT_SECRET'),
  jwtExpiresIn: () => process.env.JWT_EXPIRES_IN ?? '15m',
  cookieName: () => process.env.COOKIE_NAME ?? 'gateway_access_token',
  cookieSecure: () => process.env.COOKIE_SECURE === 'true',
  cookieSameSite: () =>
    (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ?? 'lax',
  cookieDomain: () => process.env.COOKIE_DOMAIN || undefined,
  cookiePath: () => process.env.COOKIE_PATH ?? '/',
};
