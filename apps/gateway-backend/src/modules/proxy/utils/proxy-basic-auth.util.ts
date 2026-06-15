export interface ProxyBasicCredentials {
  username: string;
  password: string;
}

/** Parses `Proxy-Authorization: Basic …` (RFC 7617). */
export function parseProxyAuthorizationBasic(
  header: string | string[] | undefined,
): ProxyBasicCredentials | null {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw?.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = Buffer.from(raw.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}
