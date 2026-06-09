export const GUARDME_BYPASS_PARAM = 'guardme_bypass';

export function buildProceedUrl(url: string, bypassToken: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(GUARDME_BYPASS_PARAM, bypassToken);
  return parsed.toString();
}
