import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { threatConfig } from '../../config/threat.config';
import { PrismaService } from '../../database/prisma.service';
import { HealthState, SystemStatusPayload } from './dto/system-status.payload';

// Short cache so the public /health endpoint and the periodic WebSocket
// broadcast do not burn VirusTotal quota (4 requests/minute)
const STATUS_CACHE_TTL_MS = 30000;

@Injectable()
export class SystemStatusService {
  private cached: { payload: SystemStatusPayload; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async getStatus(): Promise<SystemStatusPayload> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.payload;
    }

    const [db, virusTotal] = await Promise.all([
      this.checkDatabase(),
      this.checkVirusTotal(),
    ]);

    const payload: SystemStatusPayload = {
      db,
      virusTotal,
      timestamp: new Date().toISOString(),
    };

    this.cached = {
      payload,
      expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
    };

    return payload;
  }

  private async checkDatabase(): Promise<HealthState> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'degraded';
    }
  }

  private async checkVirusTotal(): Promise<HealthState> {
    const apiKey = threatConfig.virusTotalApiKey();
    if (!apiKey) {
      return 'degraded';
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${threatConfig.virusTotalApiBaseUrl()}/domains/google.com`,
          {
            headers: { 'x-apikey': apiKey },
            timeout: 5000,
            validateStatus: () => true,
          },
        ),
      );

      return response.status === 200 ? 'ok' : 'degraded';
    } catch {
      return 'degraded';
    }
  }
}
