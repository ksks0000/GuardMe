const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export function sanitizeForwardRequestHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey) || lowerKey === 'host') {
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      sanitized[key] = value.join(', ');
    }
  }

  return sanitized;
}

export function sanitizeForwardResponseHeaders(
  headers: Record<string, unknown>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (typeof value === 'number') {
      sanitized[key] = String(value);
    } else if (Array.isArray(value) && value.length > 0) {
      sanitized[key] = value.map(String).join(', ');
    }
  }

  return sanitized;
}
