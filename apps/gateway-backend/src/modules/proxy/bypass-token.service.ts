import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { proxyConfig } from '../../config/proxy.config';

export interface BypassTokenPayload {
  typ: 'guardme_bypass';
  sub: string;
  sid: string;
  url: string;
  jti: string;
}

@Injectable()
export class BypassTokenService {
  private readonly consumedTokenIds = new Map<string, number>();

  constructor(private readonly jwtService: JwtService) {}

  sign(url: string, userId: string, sessionId: string): string {
    const expiresIn =
      `${proxyConfig.bypassTokenExpiresMinutes()}m` as StringValue;

    return this.jwtService.sign(
      {
        typ: 'guardme_bypass',
        sub: userId,
        sid: sessionId,
        url,
        jti: uuidv4(),
      } satisfies BypassTokenPayload,
      { expiresIn },
    );
  }

  verifyAndConsume(
    token: string,
    url: string,
    userId: string,
    sessionId: string,
  ): boolean {
    this.purgeConsumed();

    try {
      const payload = this.jwtService.verify<BypassTokenPayload>(token);
      if (payload.typ !== 'guardme_bypass') {
        return false;
      }

      if (
        payload.sub !== userId ||
        payload.sid !== sessionId ||
        payload.url !== url
      ) {
        return false;
      }

      if (this.consumedTokenIds.has(payload.jti)) {
        return false;
      }

      this.consumedTokenIds.set(
        payload.jti,
        Date.now() + proxyConfig.bypassTokenExpiresMinutes() * 60_000,
      );
      return true;
    } catch {
      return false;
    }
  }

  private purgeConsumed(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.consumedTokenIds.entries()) {
      if (expiresAt <= now) {
        this.consumedTokenIds.delete(jti);
      }
    }
  }
}
