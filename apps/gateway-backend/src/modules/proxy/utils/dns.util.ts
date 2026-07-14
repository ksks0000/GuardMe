import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isBlockedDestinationHost } from './url.util';

const DNS_LOOKUP_TIMEOUT_MS = 2000;

export interface ResolvedDestination {
  address: string;
  family: 4 | 6;
}

export class BlockedDestinationError extends Error {
  constructor() {
    super('Destination resolves to a private or local address');
    this.name = BlockedDestinationError.name;
  }
}

export async function resolveDestinationIp(
  host: string,
): Promise<string | null> {
  try {
    return (await resolveAddresses(host))[0]?.address ?? null;
  } catch {
    return null;
  }
}

export async function resolveAllowedDestination(
  host: string,
): Promise<ResolvedDestination> {
  const addresses = await resolveAddresses(host);
  if (addresses.length === 0) {
    throw new Error('Destination host could not be resolved');
  }

  if (addresses.some(({ address }) => isBlockedDestinationHost(address))) {
    throw new BlockedDestinationError();
  }

  return addresses[0];
}

async function resolveAddresses(host: string): Promise<ResolvedDestination[]> {
  const ipVersion = isIP(host);
  if (ipVersion === 4 || ipVersion === 6) {
    return [{ address: host, family: ipVersion }];
  }

  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Destination DNS lookup timed out')),
      DNS_LOOKUP_TIMEOUT_MS,
    );
    timer.unref();
  });

  return Promise.race([
    lookup(host, { all: true, verbatim: true }).then((entries) =>
      entries.map(({ address, family }) => ({
        address,
        family: family as 4 | 6,
      })),
    ),
    timeout,
  ]);
}
