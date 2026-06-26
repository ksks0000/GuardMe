import { Injectable } from '@nestjs/common';
import { throttleConfig } from '../../config/throttle.config';

interface FailureWindow {
  count: number;
  firstAttemptAt: number;
}

@Injectable()
export class ProxyRateLimitService {
  private readonly failures = new Map<string, FailureWindow>();

  isBlocked(key: string): boolean {
    const window = this.failures.get(key);
    if (!window) {
      return false;
    }

    if (this.isExpired(window)) {
      this.failures.delete(key);
      return false;
    }

    return window.count >= throttleConfig.authLimit();
  }

  recordFailure(key: string): void {
    this.pruneExpired();

    const window = this.failures.get(key);
    if (!window || this.isExpired(window)) {
      this.failures.set(key, { count: 1, firstAttemptAt: Date.now() });
      return;
    }

    window.count += 1;
  }

  recordSuccess(key: string): void {
    this.failures.delete(key);
  }

  private isExpired(window: FailureWindow): boolean {
    return Date.now() - window.firstAttemptAt > throttleConfig.ttlMs();
  }

  private pruneExpired(): void {
    for (const [key, window] of this.failures) {
      if (this.isExpired(window)) {
        this.failures.delete(key);
      }
    }
  }
}
