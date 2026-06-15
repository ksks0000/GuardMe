// Shared CORS allowlist for the management API and WebSocket gateway
export const corsConfig = {
  allowedOrigins: (): string[] => {
    const raw =
      process.env.API_CORS_ORIGINS ??
      process.env.WS_CORS_ORIGINS ??
      'http://localhost:3000,http://localhost:4200';

    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  },
};
