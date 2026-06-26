export function parseConnectTarget(
  target: string,
): { host: string; port: number } | null {
  const trimmed = target.trim();
  if (!trimmed) {
    return null;
  }

  let host: string;
  let portPart: string | undefined;

  if (trimmed.startsWith('[')) {
    const closeBracket = trimmed.indexOf(']');
    if (closeBracket < 0) {
      return null;
    }

    host = trimmed.slice(1, closeBracket);
    const afterBracket = trimmed.slice(closeBracket + 1);
    if (afterBracket === '') {
      portPart = undefined;
    } else if (afterBracket.startsWith(':')) {
      portPart = afterBracket.slice(1);
    } else {
      return null;
    }
  } else {
    const colonCount = (trimmed.match(/:/g) ?? []).length;
    if (colonCount > 1) {
      return null;
    }

    const colonIndex = trimmed.lastIndexOf(':');
    if (colonIndex === -1) {
      host = trimmed;
      portPart = undefined;
    } else {
      host = trimmed.slice(0, colonIndex);
      portPart = trimmed.slice(colonIndex + 1);
    }
  }

  if (!host) {
    return null;
  }

  const port = portPart ? Number(portPart) : 443;
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    return null;
  }

  return { host, port };
}
