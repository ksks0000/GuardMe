import { GUARDME_BYPASS_PARAM } from './proceed-url.util';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

export function stripBypassParam(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete(GUARDME_BYPASS_PARAM);
  return parsed.toString();
}

export function extractBypassToken(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get(GUARDME_BYPASS_PARAM);
  } catch {
    return null;
  }
}

export function isBlockedDestinationHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    normalized.startsWith('169.254.')
  ) {
    return true;
  }

  const private172 = /^172\.(1[6-9]|2\d|3[01])\./;
  return private172.test(normalized);
}

export function defaultPortForScheme(scheme: string): number {
  return scheme === 'https' ? 443 : 80;
}
