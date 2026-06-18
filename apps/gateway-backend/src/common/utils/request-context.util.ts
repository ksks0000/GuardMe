import { Request } from 'express';

/** Collapses IPv4-mapped IPv6 and loopback addresses to plain IPv4 form. */
function normalizeIp(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '::1') {
    return '127.0.0.1';
  }
  const mappedIpv4 = trimmed.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  return mappedIpv4 ? mappedIpv4[1] : trimmed;
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return normalizeIp(forwarded.split(',')[0]);
  }
  const ip = req.ip ?? req.socket.remoteAddress;
  return ip ? normalizeIp(ip) : 'unknown';
}

export function extractUserAgent(req: Request): string {
  return req.headers['user-agent'] ?? 'unknown';
}
