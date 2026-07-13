import { Injectable, Logger } from '@nestjs/common';
import { uebaConfig } from '../../config/ueba.config';
import { PrismaService } from '../../database/prisma.service';
import { BaselinePayload, BehaviorBaselineSnapshot } from './dto/behavior-baseline.snapshot';
import {
  classifyBrowser,
  incrementCount,
  mean,
  median,
  round,
  stdDev,
} from './utils/baseline-stats.util';

const HOURS_PER_DAY = 24;
const MOST_ACTIVE_HOUR_SHARE = 0.05;

interface TrafficSample {
  timestamp: Date;
  url: string;
  destinationHost: string;
  destinationPort: number | null;
  method: string;
  policyDecision: string;
  threatVerdict: string;
  riskScore: number;
}

@Injectable()
export class BaselineService {
  private readonly logger = new Logger(BaselineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string): Promise<BaselinePayload> {
    const row = await this.prisma.behaviorBaseline.findUnique({
      where: { userId },
    });

    if (row) {
      return this.buildPayload(
        'ready',
        row.sampleSize,
        row.updatedAt,
        row.snapshot as unknown as BehaviorBaselineSnapshot,
      );
    }

    return this.ensureBaselineForUser(userId);
  }

  async findSnapshotForUser(
    userId: string,
  ): Promise<BehaviorBaselineSnapshot | null> {
    const row = await this.prisma.behaviorBaseline.findUnique({
      where: { userId },
    });

    if (row) {
      return row.snapshot as unknown as BehaviorBaselineSnapshot;
    }

    const payload = await this.ensureBaselineForUser(userId);
    return payload.snapshot;
  }

  async refreshForUser(userId: string): Promise<BaselinePayload> {
    const windowDays = uebaConfig.baselineWindowDays();
    const minSampleSize = uebaConfig.baselineMinSampleSize();
    const since = this.windowStart(windowDays);

    const logs: TrafficSample[] = await this.prisma.trafficLog.findMany({
      where: { userId, timestamp: { gte: since } },
      select: {
        timestamp: true,
        url: true,
        destinationHost: true,
        destinationPort: true,
        method: true,
        policyDecision: true,
        threatVerdict: true,
        riskScore: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length < minSampleSize) {
      this.logger.log(
        `Baseline refresh skipped for user ${userId}: ${logs.length}/${minSampleSize} samples`,
      );
      return this.buildPayload('insufficient_data', logs.length, null, null);
    }

    const sessions = await this.prisma.session.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true, lastVerifiedAt: true, userAgent: true },
    });

    const snapshot = this.computeSnapshot(logs, sessions, windowDays);

    const row = await this.prisma.behaviorBaseline.upsert({
      where: { userId },
      create: {
        userId,
        snapshot: snapshot as object,
        sampleSize: logs.length,
        windowDays,
      },
      update: {
        snapshot: snapshot as object,
        sampleSize: logs.length,
        windowDays,
      },
    });

    this.logger.log(
      `Baseline refreshed for user ${userId}: ${logs.length} samples over ${windowDays} days`,
    );

    return this.buildPayload('ready', row.sampleSize, row.updatedAt, snapshot);
  }

  private computeSnapshot(
    logs: TrafficSample[],
    sessions: Array<{ createdAt: Date; lastVerifiedAt: Date; userAgent: string }>,
    windowDays: number,
  ): BehaviorBaselineSnapshot {
    const activeHours = new Array<number>(HOURS_PER_DAY).fill(0);
    const perDayCounts = new Map<string, number>();
    const perHourCounts = new Map<string, number>();
    const blockedPerDay = new Map<string, number>();
    const hostsPerDay = new Map<string, Set<string>>();
    const downloadsPerDay = new Map<string, number>();

    const hostCounts: Record<string, number> = {};
    const policyDecisions: Record<string, number> = {};
    const threatVerdicts: Record<string, number> = {};
    const methodDistribution: Record<string, number> = {};
    const portDistribution: Record<string, number> = {};
    const browsers: Record<string, number> = {};

    let riskSum = 0;
    let riskMax = 0;
    let uploadCount = 0;

    for (const log of logs) {
      const dayKey = log.timestamp.toISOString().slice(0, 10);
      const hourKey = log.timestamp.toISOString().slice(0, 13);
      const method = log.method.toUpperCase();

      activeHours[log.timestamp.getHours()] += 1;
      perDayCounts.set(dayKey, (perDayCounts.get(dayKey) ?? 0) + 1);
      perHourCounts.set(hourKey, (perHourCounts.get(hourKey) ?? 0) + 1);

      incrementCount(hostCounts, log.destinationHost);
      incrementCount(policyDecisions, log.policyDecision);
      incrementCount(threatVerdicts, log.threatVerdict);
      incrementCount(methodDistribution, method);
      incrementCount(portDistribution, String(log.destinationPort ?? 'unknown'));

      if (log.policyDecision === 'BLOCK') {
        blockedPerDay.set(dayKey, (blockedPerDay.get(dayKey) ?? 0) + 1);
      }

      if (method === 'POST' || method === 'PUT') {
        uploadCount += 1;
      }

      if (this.looksLikeFileDownload(log.url)) {
        downloadsPerDay.set(dayKey, (downloadsPerDay.get(dayKey) ?? 0) + 1);
      }

      const dayHosts = hostsPerDay.get(dayKey) ?? new Set<string>();
      dayHosts.add(log.destinationHost);
      hostsPerDay.set(dayKey, dayHosts);

      riskSum += log.riskScore;
      riskMax = Math.max(riskMax, log.riskScore);
    }

    for (const session of sessions) {
      incrementCount(browsers, classifyBrowser(session.userAgent));
    }

    const sessionDurations = sessions.map(
      (session) =>
        (session.lastVerifiedAt.getTime() - session.createdAt.getTime()) / 60000,
    );

    const total = logs.length;
    const totalHoursInWindow = windowDays * HOURS_PER_DAY;
    const activeHourCounts = [...perHourCounts.values()];
    // Include idle days/hours as zeros so averages describe a typical window day
    const dailyCounts = this.withZeroFill([...perDayCounts.values()], windowDays);
    const hourlyCounts = this.withZeroFill(activeHourCounts, totalHoursInWindow);

    const topHosts = Object.entries(hostCounts)
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host))
      .slice(0, 20);

    const knownHosts = Object.entries(hostCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, uebaConfig.baselineMaxKnownHosts())
      .map(([host]) => host);

    const mostActiveHours = activeHours
      .map((count, hour) => ({ hour, count }))
      .filter((entry) => entry.count >= total * MOST_ACTIVE_HOUR_SHARE)
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.hour);

    return {
      computedAt: new Date().toISOString(),
      windowDays,
      sampleSize: total,
      activeHours,
      mostActiveHours,
      requestsPerHour: {
        average: round(mean(hourlyCounts)),
        stdDev: round(stdDev(hourlyCounts)),
      },
      requestsPerActiveHour: {
        average: round(mean(activeHourCounts)),
        stdDev: round(stdDev(activeHourCounts)),
      },
      requestsPerDay: {
        average: round(mean(dailyCounts)),
        stdDev: round(stdDev(dailyCounts)),
      },
      blockedPerDay: {
        average: round(
          this.sumValues(blockedPerDay) / Math.max(windowDays, 1),
        ),
      },
      policyDecisions,
      threatVerdicts,
      methodDistribution,
      portDistribution,
      topHosts,
      knownHosts,
      uniqueHostsPerDay: {
        median: round(
          median([...hostsPerDay.values()].map((hosts) => hosts.size)),
        ),
      },
      riskScore: {
        average: round(total > 0 ? riskSum / total : 0),
        max: riskMax,
      },
      uploadShare: round(total > 0 ? uploadCount / total : 0, 4),
      downloadRequestsPerDay: {
        average: round(
          this.sumValues(downloadsPerDay) / Math.max(windowDays, 1),
        ),
      },
      sessions: {
        count: sessions.length,
        averageDurationMinutes: round(mean(sessionDurations)),
      },
      browsers,
    };
  }

  private async ensureBaselineForUser(userId: string): Promise<BaselinePayload> {
    const windowDays = uebaConfig.baselineWindowDays();
    const minSampleSize = uebaConfig.baselineMinSampleSize();
    const sampleSize = await this.prisma.trafficLog.count({
      where: {
        userId,
        timestamp: { gte: this.windowStart(windowDays) },
      },
    });

    if (sampleSize < minSampleSize) {
      return this.buildPayload('insufficient_data', sampleSize, null, null);
    }

    return this.refreshForUser(userId);
  }

  private windowStart(windowDays: number): Date {
    return new Date(Date.now() - windowDays * HOURS_PER_DAY * 3600000);
  }

  private looksLikeFileDownload(url: string): boolean {
    try {
      const lastSegment = new URL(url).pathname.split('/').pop() ?? '';
      return lastSegment.includes('.');
    } catch {
      return false;
    }
  }

  private withZeroFill(counts: number[], expectedLength: number): number[] {
    if (counts.length >= expectedLength) {
      return counts;
    }
    return [...counts, ...new Array<number>(expectedLength - counts.length).fill(0)];
  }

  private sumValues(map: Map<string, number>): number {
    return [...map.values()].reduce((sum, value) => sum + value, 0);
  }

  private buildPayload(
    status: BaselinePayload['status'],
    sampleSize: number,
    updatedAt: Date | null,
    snapshot: BehaviorBaselineSnapshot | null,
  ): BaselinePayload {
    return {
      status,
      sampleSize,
      minSampleSize: uebaConfig.baselineMinSampleSize(),
      windowDays: uebaConfig.baselineWindowDays(),
      updatedAt: updatedAt ? updatedAt.toISOString() : null,
      snapshot,
    };
  }
}
