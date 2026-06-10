import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const DNS_LOOKUP_TIMEOUT_MS = 2_000;

/**
 * Best-effort resolution of the destination host to an IP for traffic logs.
 * Returns null on failure or timeout — logging must never fail on DNS.
 */
export async function resolveDestinationIp(
  host: string,
): Promise<string | null> {
  if (isIP(host)) {
    return host;
  }

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), DNS_LOOKUP_TIMEOUT_MS),
  );

  try {
    const result = await Promise.race([
      lookup(host).then((entry) => entry.address),
      timeout,
    ]);
    return result;
  } catch {
    return null;
  }
}
