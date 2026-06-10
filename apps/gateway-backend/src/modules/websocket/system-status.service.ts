import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { threatConfig } from '../../config/threat.config';
import { PrismaService } from '../../database/prisma.service';
import { HealthState, SystemStatusPayload } from './dto/system-status.payload';

@Injectable()
export class SystemStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async getStatus(): Promise<SystemStatusPayload> {
    const [db, virusTotal] = await Promise.all([
      this.checkDatabase(),
      this.checkVirusTotal(),
    ]);

    return {
      db,
      virusTotal,
      timestamp: new Date().toISOString(),
    };
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
        this.httpService.get(`${threatConfig.virusTotalApiBaseUrl()}/domains/google.com`, {
          headers: { 'x-apikey': apiKey },
          timeout: 5_000,
          validateStatus: () => true,
        }),
      );

      return response.status < 500 ? 'ok' : 'degraded';
    } catch {
      return 'degraded';
    }
  }
}
