import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { SIEM_EMIT_EVENTS } from '../../config/siem.config';
import { PrismaService } from '../../database/prisma.service';
import { TrafficLogPayload } from '../websocket/dto/traffic-log.payload';
import { toTrafficLogPayload } from '../websocket/utils/payload-mapper.util';
import { PaginatedResultDto } from './dto/paginated-result.dto';
import { SecurityEventDetailPayload } from './dto/security-event-detail.payload';
import { SecurityEventsQueryDto } from './dto/security-events-query.dto';
import {
  resolveEventSeverity,
  SecurityEventInput,
} from './dto/security-event.input';
import { TrafficLogInput } from './dto/traffic-log.input';
import { TrafficLogsQueryDto } from './dto/traffic-logs-query.dto';
import { toSecurityEventDetailPayload } from './utils/history-payload.mapper';
import { sanitizeSearchTerm } from './utils/search-term.util';
import { buildSecurityEventUserScope } from './utils/security-event-user-scope.util';

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
          policyDecision: input.policyDecision,
          threatVerdict: input.threatVerdict,
          matchedRuleId: input.matchedRuleId ?? null,
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

  async findTrafficLogsForUser(
    userId: string,
    query: TrafficLogsQueryDto,
  ): Promise<PaginatedResultDto<TrafficLogPayload>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 15;
    const skip = (page - 1) * pageSize;
    const where = this.buildTrafficLogWhere(userId, query);

    const [total, rows] = await Promise.all([
      this.prisma.trafficLog.count({ where }),
      this.prisma.trafficLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map(toTrafficLogPayload),
      total,
      page,
      pageSize,
    };
  }

  async findSecurityEventsForUser(
    userId: string,
    username: string,
    query: SecurityEventsQueryDto,
  ): Promise<PaginatedResultDto<SecurityEventDetailPayload>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 15;
    const skip = (page - 1) * pageSize;
    const where = this.buildSecurityEventWhere(userId, username, query);

    const [total, rows] = await Promise.all([
      this.prisma.securityEvent.count({ where }),
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map(toSecurityEventDetailPayload),
      total,
      page,
      pageSize,
    };
  }

  private buildTrafficLogWhere(
    userId: string,
    query: TrafficLogsQueryDto,
  ): Prisma.TrafficLogWhereInput {
    const where: Prisma.TrafficLogWhereInput = { userId };

    if (query.threatVerdict) {
      where.threatVerdict = query.threatVerdict;
    }

    if (query.policyDecision) {
      where.policyDecision = query.policyDecision;
    }

    const urlSearch = sanitizeSearchTerm(query.urlSearch);
    if (urlSearch) {
      where.OR = [
        { url: { contains: urlSearch, mode: 'insensitive' } },
        { destinationHost: { contains: urlSearch, mode: 'insensitive' } },
      ];
    }

    const destinationIp = sanitizeSearchTerm(query.destinationIp);
    if (destinationIp) {
      where.destinationIp = { contains: destinationIp, mode: 'insensitive' };
    }

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) {
        where.timestamp.gte = new Date(query.from);
      }
      if (query.to) {
        where.timestamp.lte = new Date(query.to);
      }
    }

    return where;
  }

  private buildSecurityEventWhere(
    userId: string,
    username: string,
    query: SecurityEventsQueryDto,
  ): Prisma.SecurityEventWhereInput {
    const clauses: Prisma.SecurityEventWhereInput[] = [
      buildSecurityEventUserScope(userId, username),
    ];

    if (query.type) {
      clauses.push({ type: query.type });
    }

    if (query.severity) {
      clauses.push({ severity: query.severity });
    }

    if (query.from || query.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.from) {
        createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        createdAt.lte = new Date(query.to);
      }
      clauses.push({ createdAt });
    }

    return { AND: clauses };
  }

  private logPersistenceFallback(
    label: string,
    payload: unknown,
    error: unknown,
  ): void {
    const message =
      error instanceof Error ? error.message : 'Unknown database error';

    this.logger.warn(
      `Failed to persist ${label}: ${message}`,
      JSON.stringify(payload),
    );
  }
}
