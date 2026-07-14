const DEFAULT_ORIGINS = 'http://localhost:3000,http://localhost:4200';

export const corsConfig = {
  apiOrigins: (): string[] =>
    parseOrigins(process.env.API_CORS_ORIGINS ?? DEFAULT_ORIGINS),
  websocketOrigins: (): string[] =>
    parseOrigins(process.env.WS_CORS_ORIGINS ?? process.env.API_CORS_ORIGINS ?? DEFAULT_ORIGINS),
};

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
