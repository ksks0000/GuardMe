import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { SIEM_EMIT_EVENTS } from '../../config/siem.config';
import { PrismaService } from '../../database/prisma.service';
import {
  resolveEventSeverity,
  SecurityEventInput,
} from './dto/security-event.input';
import { TrafficLogInput } from './dto/traffic-log.input';

@Injectable()
export class SiemService {
  private readonly logger = new Logger(SiemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async logTraffic(input: TrafficLogInput): Promise<void> {
    try {
      const row = await this.prisma.trafficLog.create({
        data: {
          userId: input.userId,
          clientIp: input.clientIp,
          url: input.url,
          destinationHost: input.destinationHost,
          destinationPort: input.destinationPort ?? null,
          destinationIp: input.destinationIp ?? null,
          method: input.method,
          verdict: input.verdict,
          riskScore: input.riskScore,
          timestamp: input.timestamp ?? new Date(),
        },
      });

      this.emitEvent(SIEM_EMIT_EVENTS.TRAFFIC_LOG, row);
    } catch (error) {
      this.logPersistenceFallback('traffic log', input, error);
    }
  }

  async logSecurityEvent(input: SecurityEventInput): Promise<void> {
    const severity = resolveEventSeverity(input.type, input.severity);

    try {
      const row = await this.prisma.securityEvent.create({
        data: {
          type: input.type,
          severity,
          message: input.message,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      });

      this.emitEvent(SIEM_EMIT_EVENTS.SECURITY_EVENT, row);
    } catch (error) {
      this.logPersistenceFallback(
        'security event',
        { ...input, severity },
        error,
      );
    }
  }

  emitEvent(eventName: string, payload: unknown): void {
    this.eventEmitter.emit(eventName, payload);
  }

  private logPersistenceFallback(
    label: string,
    payload: unknown,
    error: unknown,
  ): void {
    const message =
      error instanceof Error ? error.message : 'Unknown database error';

    this.logger.warn(
      `Failed to persist ${label}; falling back to console. ${message}`,
      JSON.stringify(payload),
    );
  }
}
