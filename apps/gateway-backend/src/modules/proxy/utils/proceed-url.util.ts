export const GUARDME_BYPASS_TOKEN_PLACEHOLDER = 'GUARDME_BYPASS_TOKEN_PLACEHOLDER';

export function buildProceedUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}guardme_bypass=${GUARDME_BYPASS_TOKEN_PLACEHOLDER}`;
}
