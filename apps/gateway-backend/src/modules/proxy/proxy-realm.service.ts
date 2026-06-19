import { Injectable } from '@nestjs/common';

@Injectable()
export class ProxyRealmService {
  private nonce = 0;

  getRealm(): string {
    return `GuardMe-${this.nonce}`;
  }

  rotate(): void {
    this.nonce += 1;
  }
}
