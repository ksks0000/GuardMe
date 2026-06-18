import { Injectable } from '@nestjs/common';

/** In-memory vault key cache — cleared on lock/logout; never persisted. */
@Injectable()
export class VaultKeyCacheService {
  private readonly keys = new Map<string, Buffer>();

  isUnlocked(userId: string): boolean {
    return this.keys.has(userId);
  }

  setKey(userId: string, key: Buffer): void {
    this.clearKey(userId);
    this.keys.set(userId, key);
  }

  getKey(userId: string): Buffer | null {
    return this.keys.get(userId) ?? null;
  }

  clearKey(userId: string): void {
    const key = this.keys.get(userId);
    if (key) {
      key.fill(0);
    }
    this.keys.delete(userId);
  }
}
