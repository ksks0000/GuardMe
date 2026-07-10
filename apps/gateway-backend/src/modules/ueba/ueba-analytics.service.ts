import { Injectable } from '@nestjs/common';
import { SecurityEvent } from '@prisma/client';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { PrismaService } from '../../database/prisma.service';
import { resolveAnalyticsRange } from '../siem/utils/analytics-range.util';
import { UebaAnomaliesQueryDto } from './dto/ueba-anomalies-query.dto';
import {
  UebaAnomaliesPayload,
  UebaAnomalyItemPayload,
  UebaAnomalyTimelineBucket,
  UebaRiskTrendPoint,
} from './dto/ueba-anomalies.payload';

const MAX_TIMELINE_EVENTS = 5000;

@Injectable()
export class UebaAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnomaliesForUser(
    userId: string,
    query: UebaAnomaliesQueryDto,
  ): Promise<UebaAnomaliesPayload> {
    const range = resolveAnalyticsRange({
      from: query.from,
      to: query.to,
    });
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 15;
    const skip = (page - 1) * pageSize;

    const where = {
      userId,
      type: SIEM_EVENT_TYPES.ANOMALY_DETECTED,
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    };

    const [total, pageRows, timelineRows, trafficRows] = await Promise.all([
      this.prisma.securityEvent.count({ where }),
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: MAX_TIMELINE_EVENTS,
        select: {
          createdAt: true,
          metadata: true,
        },
      }),
      this.prisma.trafficLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: range.from,
            lte: range.to,
          },
        },
        select: {
          timestamp: true,
          riskScore: true,
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    return {
      period: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      items: pageRows.map((row) => toAnomalyItem(row)),
      total,
      page,
      pageSize,
      timeline: buildAnomalyTimeline(timelineRows),
      riskTrend: buildRiskTrend(trafficRows),
    };
  }
}

function toAnomalyItem(row: SecurityEvent): UebaAnomalyItemPayload {
  const metadata = readMetadata(row.metadata);

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    severity: row.severity as UebaAnomalyItemPayload['severity'],
    message: row.message,
    anomalyScore: readNumber(metadata.anomalyScore) ?? 0,
    signals: readStringArray(metadata.signals),
    destinationHost: readString(metadata.destinationHost),
    policyDecision: readString(metadata.policyDecision),
    threatVerdict: readString(metadata.threatVerdict),
    riskScore: readNumber(metadata.riskScore),
  };
}

function buildAnomalyTimeline(
  rows: Array<{ createdAt: Date; metadata: unknown }>,
): UebaAnomalyTimelineBucket[] {
  const buckets = new Map<string, { totalScore: number; count: number }>();

  for (const row of rows) {
    const metadata = readMetadata(row.metadata);
    const date = row.createdAt.toISOString().slice(0, 10);
    const score = readNumber(metadata.anomalyScore) ?? 0;
    const current = buckets.get(date) ?? { totalScore: 0, count: 0 };
    current.totalScore += score;
    current.count += 1;
    buckets.set(date, current);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      count: bucket.count,
      averageScore: round(bucket.count > 0 ? bucket.totalScore / bucket.count : 0),
    }));
}

function buildRiskTrend(
  rows: Array<{ timestamp: Date; riskScore: number }>,
): UebaRiskTrendPoint[] {
  const buckets = new Map<string, { totalRisk: number; count: number }>();

  for (const row of rows) {
    const date = row.timestamp.toISOString().slice(0, 10);
    const current = buckets.get(date) ?? { totalRisk: 0, count: 0 };
    current.totalRisk += row.riskScore;
    current.count += 1;
    buckets.set(date, current);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, bucket]) => ({
      date,
      averageRisk: round(bucket.count > 0 ? bucket.totalRisk / bucket.count : 0),
      requestCount: bucket.count,
    }));
}

function readMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
