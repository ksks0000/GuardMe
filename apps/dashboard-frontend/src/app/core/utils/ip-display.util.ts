const PLACEHOLDER = '—';

// Normalizes IP addresses for display in plain IPv4 form
export function formatIpAddress(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return PLACEHOLDER;
  }

  if (trimmed === '::1') {
    return '127.0.0.1';
  }

  const mappedIpv4 = trimmed.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4) {
    return mappedIpv4[1];
  }

  return trimmed;
}
