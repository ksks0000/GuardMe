import { Injectable } from '@nestjs/common';
import { proxyConfig } from '../../config/proxy.config';
import { ThreatScanResult } from '../threat/dto/threat-scan.result';

interface CacheEntry {
  result: ThreatScanResult;
  expiresAt: number;
}

@Injectable()
export class ThreatScanCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(url: string): ThreatScanResult | null {
    this.purgeExpired();
    const entry = this.cache.get(url);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(url);
      return null;
    }

    return entry.result;
  }

  set(url: string, result: ThreatScanResult): void {
    this.cache.set(url, {
      result,
      expiresAt: Date.now() + proxyConfig.threatCacheTtlMs(),
    });
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(url);
      }
    }
  }
}
