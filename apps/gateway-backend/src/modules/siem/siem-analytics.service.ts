import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SIEM_EVENT_SEVERITIES,
  SIEM_EVENT_TYPES,
} from '../../config/siem.config';
import { PrismaService } from '../../database/prisma.service';
import { PolicyDecision } from '../proxy/dto/policy-decision.enum';
import { ThreatVerdict } from '../threat/dto/threat-verdict.enum';
import { AnalyticsSummaryQueryDto } from './dto/analytics-summary-query.dto';
import { AnalyticsSummaryPayload } from './dto/analytics-summary.payload';
import {
  roundRiskAverage,
  toCountRecord,
} from './utils/analytics-aggregation.util';
import { resolveAnalyticsRange } from './utils/analytics-range.util';

const POLICY_DECISIONS = Object.values(PolicyDecision);
const THREAT_VERDICTS = Object.values(ThreatVerdict);
const EVENT_TYPES = Object.values(SIEM_EVENT_TYPES);
const EVENT_SEVERITIES = Object.values(SIEM_EVENT_SEVERITIES);
const HIGH_RISK_THRESHOLD = 70;
const TOP_HOST_LIMIT = 10;

interface TimeBucketRow {
  bucket_start: Date;
  total: bigint;
  blocked: bigint;
}

@Injectable()
export class SiemAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummaryForUser(
    userId: string,
    username: string,
    query: AnalyticsSummaryQueryDto,
  ): Promise<AnalyticsSummaryPayload> {
    const range = resolveAnalyticsRange(query);
    const trafficWhere = this.buildTrafficWhere(userId, range.from, range.to);
    const securityWhere = this.buildSecurityEventWhere(
      userId,
      username,
      range.from,
      range.to,
    );

    const [
      totalRequests,
      policyDecisionGroups,
      threatVerdictGroups,
      riskAggregate,
      highRiskCount,
      topHosts,
      timeBuckets,
      securityEventTotal,
      securityTypeGroups,
      securitySeverityGroups,
    ] = await Promise.all([
      this.prisma.trafficLog.count({ where: trafficWhere }),
      this.prisma.trafficLog.groupBy({
        by: ['policyDecision'],
        where: trafficWhere,
        _count: { _all: true },
      }),
      this.prisma.trafficLog.groupBy({
        by: ['threatVerdict'],
        where: trafficWhere,
        _count: { _all: true },
      }),
      this.prisma.trafficLog.aggregate({
        where: trafficWhere,
        _avg: { riskScore: true },
        _max: { riskScore: true },
      }),
      this.prisma.trafficLog.count({
        where: {
          ...trafficWhere,
          riskScore: { gte: HIGH_RISK_THRESHOLD },
        },
      }),
      this.prisma.trafficLog.groupBy({
        by: ['destinationHost'],
        where: trafficWhere,
        _count: { _all: true },
        orderBy: { _count: { destinationHost: 'desc' } },
        take: TOP_HOST_LIMIT,
      }),
      this.queryTimeBuckets(userId, range.from, range.to, range.bucketHours),
      this.prisma.securityEvent.count({ where: securityWhere }),
      this.prisma.securityEvent.groupBy({
        by: ['type'],
        where: securityWhere,
        _count: { _all: true },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['severity'],
        where: securityWhere,
        _count: { _all: true },
      }),
    ]);

    return {
      period: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        bucketHours: range.bucketHours,
      },
      traffic: {
        totalRequests,
        byPolicyDecision: toCountRecord(
          POLICY_DECISIONS,
          policyDecisionGroups.map((row) => ({
            key: row.policyDecision,
            count: row._count._all,
          })),
        ),
        byThreatVerdict: toCountRecord(
          THREAT_VERDICTS,
          threatVerdictGroups.map((row) => ({
            key: row.threatVerdict,
            count: row._count._all,
          })),
        ),
        risk: {
          average: roundRiskAverage(riskAggregate._avg.riskScore),
          max: riskAggregate._max.riskScore ?? 0,
          highRiskCount,
        },
        topDestinationHosts: topHosts.map((row) => ({
          host: row.destinationHost,
          count: row._count._all,
        })),
        timeBuckets: timeBuckets.map((row) => ({
          bucketStart: row.bucket_start.toISOString(),
          requestCount: Number(row.total),
          blockedCount: Number(row.blocked),
        })),
      },
      securityEvents: {
        total: securityEventTotal,
        byType: toCountRecord(
          EVENT_TYPES,
          securityTypeGroups.map((row) => ({
            key: row.type,
            count: row._count._all,
          })),
        ),
        bySeverity: toCountRecord(
          EVENT_SEVERITIES,
          securitySeverityGroups.map((row) => ({
            key: row.severity,
            count: row._count._all,
          })),
        ),
      },
    };
  }

  private buildTrafficWhere(
    userId: string,
    from: Date,
    to: Date,
  ): Prisma.TrafficLogWhereInput {
    return {
      userId,
      timestamp: {
        gte: from,
        lte: to,
      },
    };
  }

  private buildSecurityEventWhere(
    userId: string,
    username: string,
    from: Date,
    to: Date,
  ): Prisma.SecurityEventWhereInput {
    return {
      createdAt: {
        gte: from,
        lte: to,
      },
      OR: [
        {
          metadata: {
            path: ['userId'],
            equals: userId,
          },
        },
        {
          metadata: {
            path: ['attemptedUsername'],
            equals: username,
          },
        },
      ],
    };
  }

  private queryTimeBuckets(
    userId: string,
    from: Date,
    to: Date,
    bucketHours: number,
  ): Promise<TimeBucketRow[]> {
    const bucketStart = this.bucketStartExpression(bucketHours);

    return this.prisma.$queryRaw<TimeBucketRow[]>`
      SELECT
        ${bucketStart} AS bucket_start,
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE policy_decision = ${PolicyDecision.BLOCK})::bigint AS blocked
      FROM traffic_logs
      WHERE user_id = ${userId}::uuid
        AND timestamp >= ${from}
        AND timestamp <= ${to}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC
    `;
  }

  private bucketStartExpression(bucketHours: number): Prisma.Sql {
    if (bucketHours === 1) {
      return Prisma.sql`date_trunc('hour', timestamp)`;
    }

    if (bucketHours === 24) {
      return Prisma.sql`date_trunc('day', timestamp)`;
    }

    return Prisma.sql`date_trunc('day', timestamp) + (floor(extract(hour from timestamp) / ${bucketHours}) * ${bucketHours}) * interval '1 hour'`;
  }
}
