import { isIP } from 'node:net';
import { GUARDME_BYPASS_PARAM } from './proceed-url.util';

const BLOCKED_HOSTNAMES = new Set(['localhost']);

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
  const normalized = stripIpv6Brackets(host.trim().toLowerCase());

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    return isPrivateOrLoopbackIpv4(normalized);
  }
  if (ipVersion === 6) {
    return isPrivateOrLocalIpv6(normalized);
  }

  return false;
}

export function defaultPortForScheme(scheme: string): number {
  return scheme === 'https' ? 443 : 80;
}

function stripIpv6Brackets(host: string): string {
  if (host.startsWith('[') && host.endsWith(']')) {
    return host.slice(1, -1);
  }
  return host;
}

function isPrivateOrLoopbackIpv4(ip: string): boolean {
  if (ip === '0.0.0.0') {
    return true;
  }

  if (ip.startsWith('127.')) {
    return true;
  }

  if (ip.startsWith('10.')) {
    return true;
  }

  if (ip.startsWith('192.168.')) {
    return true;
  }

  if (ip.startsWith('169.254.')) {
    return true;
  }

  return /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

function isPrivateOrLocalIpv6(ip: string): boolean {
  if (ip === '::1') {
    return true;
  }

  const mappedIpv4 = unwrapIpv4Mapped(ip);
  if (mappedIpv4) {
    return isPrivateOrLoopbackIpv4(mappedIpv4);
  }

  if (isLinkLocalIpv6(ip)) {
    return true;
  }

  return isUniqueLocalIpv6(ip);
}

function unwrapIpv4Mapped(ip: string): string | null {
  const lower = ip.toLowerCase();
  if (!lower.startsWith('::ffff:')) {
    return null;
  }

  const suffix = lower.slice('::ffff:'.length);
  if (isIP(suffix) === 4) {
    return suffix;
  }

  return null;
}

function isLinkLocalIpv6(ip: string): boolean {
  const firstHextet = ip.split(':').find((part) => part.length > 0) ?? '';
  if (!firstHextet) {
    return false;
  }

  const value = Number.parseInt(firstHextet, 16);
  if (Number.isNaN(value)) {
    return false;
  }

  return value >= 0xfe80 && value <= 0xfebf;
}

function isUniqueLocalIpv6(ip: string): boolean {
  const firstHextet = ip.split(':').find((part) => part.length > 0) ?? '';
  if (!firstHextet) {
    return false;
  }

  const value = Number.parseInt(firstHextet, 16);
  if (Number.isNaN(value)) {
    return false;
  }

  return value >= 0xfc00 && value <= 0xfdff;
}
