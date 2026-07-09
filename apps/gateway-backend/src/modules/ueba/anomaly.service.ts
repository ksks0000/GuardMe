import { Injectable } from '@nestjs/common';
import { TrafficLog } from '@prisma/client';
import { SIEM_EVENT_SEVERITIES } from '../../config/siem.config';
import { uebaConfig } from '../../config/ueba.config';
import { PrismaService } from '../../database/prisma.service';
import { BehaviorBaselineSnapshot } from './dto/behavior-baseline.snapshot';
import { AnomalyResult, AnomalySignal } from './dto/anomaly-result';

const SIGNAL_WEIGHTS: Record<AnomalySignal, number> = {
  new_host: 30,
  volume_spike: 25,
  off_hours_activity: 20,
  repeated_blocks: 15,
  high_risk_cluster: 25,
};

export interface AnomalyScoringContext {
  currentHourRequestCount: number;
  recentBlockCount: number;
  recentAverageRiskScore: number;
  hostSeenInLookback: boolean;
}

@Injectable()
export class AnomalyService {
  constructor(private readonly prisma: PrismaService) {}

  async buildScoringContext(
    userId: string,
    log: TrafficLog,
  ): Promise<AnomalyScoringContext> {
    const eventTime = log.timestamp;
    const hourStart = new Date(eventTime);
    hourStart.setMinutes(0, 0, 0);

    const lookbackDays = uebaConfig.newHostLookbackDays();
    const hostLookbackSince = new Date(eventTime.getTime() - lookbackDays * 24 * 60 * 60000);
    const blockWindowSince = new Date(eventTime.getTime() - uebaConfig.repeatedBlocksWindowMs());
    const riskWindowSince = new Date(eventTime.getTime() - uebaConfig.highRiskWindowMs());

    const [currentHourRequestCount, recentBlockCount, riskAggregate, priorHostCount] =
      await Promise.all([
        this.prisma.trafficLog.count({
          where: {
            userId,
            timestamp: { gte: hourStart, lte: eventTime },
          },
        }),
        this.prisma.trafficLog.count({
          where: {
            userId,
            timestamp: { gte: blockWindowSince, lte: eventTime },
            OR: [
              { policyDecision: 'BLOCK' },
              { threatVerdict: 'MALICIOUS' },
            ],
          },
        }),
        this.prisma.trafficLog.aggregate({
          where: {
            userId,
            timestamp: { gte: riskWindowSince, lte: eventTime },
          },
          _avg: { riskScore: true },
        }),
        this.prisma.trafficLog.count({
          where: {
            userId,
            destinationHost: log.destinationHost,
            timestamp: { gte: hostLookbackSince, lt: eventTime },
          },
        }),
      ]);

    return {
      currentHourRequestCount,
      recentBlockCount,
      recentAverageRiskScore: riskAggregate._avg.riskScore ?? 0,
      hostSeenInLookback: priorHostCount > 0,
    };
  }

  scoreTrafficEvent(
    log: TrafficLog,
    baseline: BehaviorBaselineSnapshot,
    context: AnomalyScoringContext,
  ): AnomalyResult {
    const signals: AnomalySignal[] = [];

    if (this.isNewHost(log.destinationHost, baseline, context)) {
      signals.push('new_host');
    }

    if (this.isVolumeSpike(context.currentHourRequestCount, baseline)) {
      signals.push('volume_spike');
    }

    if (this.isOffHoursActivity(log.timestamp, baseline)) {
      signals.push('off_hours_activity');
    }

    if (this.hasRepeatedBlocks(context.recentBlockCount)) {
      signals.push('repeated_blocks');
    }

    if (this.isHighRiskCluster(context.recentAverageRiskScore)) {
      signals.push('high_risk_cluster');
    }

    const anomalyScore = this.computeScore(signals);

    return {
      anomalyScore,
      signals,
      severity: this.resolveSeverity(anomalyScore),
    };
  }

  private isNewHost(
    host: string,
    baseline: BehaviorBaselineSnapshot,
    context: AnomalyScoringContext,
  ): boolean {
    const knownHosts = new Set(baseline.knownHosts);
    return !knownHosts.has(host) && !context.hostSeenInLookback;
  }

  private isVolumeSpike(
    currentHourRequestCount: number,
    baseline: BehaviorBaselineSnapshot,
  ): boolean {
    const reference = baseline.requestsPerActiveHour.average;
    if (reference <= 0) {
      return false;
    }

    return (
      currentHourRequestCount >
      reference * uebaConfig.volumeSpikeMultiplier()
    );
  }

  private isOffHoursActivity(
    timestamp: Date,
    baseline: BehaviorBaselineSnapshot,
  ): boolean {
    const hour = timestamp.getHours();
    const total = baseline.activeHours.reduce((sum, count) => sum + count, 0);
    if (total <= 0) {
      return false;
    }

    const hourShare = baseline.activeHours[hour] / total;
    return hourShare < uebaConfig.offHoursActivityShare();
  }

  private hasRepeatedBlocks(recentBlockCount: number): boolean {
    return recentBlockCount > uebaConfig.repeatedBlocksThreshold();
  }

  private isHighRiskCluster(recentAverageRiskScore: number): boolean {
    return recentAverageRiskScore > uebaConfig.highRiskScoreThreshold();
  }

  private computeScore(signals: AnomalySignal[]): number {
    const raw = signals.reduce(
      (sum, signal) => sum + SIGNAL_WEIGHTS[signal],
      0,
    );
    return Math.min(100, raw);
  }

  private resolveSeverity(score: number): AnomalyResult['severity'] {
    if (score >= 85) {
      return SIEM_EVENT_SEVERITIES.HIGH;
    }
    if (score >= uebaConfig.alertThreshold()) {
      return SIEM_EVENT_SEVERITIES.MEDIUM;
    }
    return SIEM_EVENT_SEVERITIES.LOW;
  }
}
