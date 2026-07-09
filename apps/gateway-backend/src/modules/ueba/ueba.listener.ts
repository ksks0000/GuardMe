import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrafficLog } from '@prisma/client';
import { DOMAIN_EVENTS } from '../../config/events.config';
import { SIEM_EVENT_TYPES } from '../../config/siem.config';
import { uebaConfig } from '../../config/ueba.config';
import { SiemService } from '../siem/siem.service';
import { AnomalyService } from './anomaly.service';
import { BaselineService } from './baseline.service';
import { BehaviorBaselineSnapshot } from './dto/behavior-baseline.snapshot';
import { UebaAnomalyPayload } from './dto/ueba-anomaly.payload';

@Injectable()
export class UebaListener {
  private readonly logger = new Logger(UebaListener.name);
  private readonly lastAlertAtByUser = new Map<string, number>();

  constructor(
    private readonly baselineService: BaselineService,
    private readonly anomalyService: AnomalyService,
    private readonly siemService: SiemService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(DOMAIN_EVENTS.TRAFFIC_LOG_CREATED)
  async handleTrafficLogCreated(log: TrafficLog): Promise<void> {
    try {
      const baseline = await this.baselineService.findSnapshotForUser(log.userId);
      if (!baseline) {
        return;
      }

      const context = await this.anomalyService.buildScoringContext(
        log.userId,
        log,
      );
      const result = this.anomalyService.scoreTrafficEvent(
        log,
        baseline,
        context,
      );

      if (result.anomalyScore < uebaConfig.alertThreshold()) {
        return;
      }

      if (this.isInCooldown(log.userId)) {
        this.logger.debug(
          `Anomaly alert suppressed for user ${log.userId} (cooldown active)`,
        );
        return;
      }

      await this.recordAnomaly(log, baseline, result);
      this.lastAlertAtByUser.set(log.userId, Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `UEBA scoring failed for traffic log ${log.id}: ${message}`,
      );
    }
  }

  private isInCooldown(userId: string): boolean {
    const lastAlertAt = this.lastAlertAtByUser.get(userId);
    if (!lastAlertAt) {
      return false;
    }

    return Date.now() - lastAlertAt < uebaConfig.alertCooldownMs();
  }

  private async recordAnomaly(
    log: TrafficLog,
    baseline: BehaviorBaselineSnapshot,
    result: UebaAnomalyPayload['result'],
  ): Promise<void> {
    const payload: UebaAnomalyPayload = {
      userId: log.userId,
      trafficLogId: log.id,
      destinationHost: log.destinationHost,
      timestamp: log.timestamp.toISOString(),
      result,
    };

    await this.siemService.logSecurityEvent({
      type: SIEM_EVENT_TYPES.ANOMALY_DETECTED,
      userId: log.userId,
      message: `Behavioral anomaly detected (score ${result.anomalyScore})`,
      severity: result.severity,
      metadata: {
        userId: log.userId,
        trafficLogId: log.id,
        destinationHost: log.destinationHost,
        policyDecision: log.policyDecision,
        threatVerdict: log.threatVerdict,
        riskScore: log.riskScore,
        anomalyScore: result.anomalyScore,
        signals: result.signals,
        baselineComputedAt: baseline.computedAt,
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.UEBA_ANOMALY_DETECTED, payload);

    this.logger.log(
      `Anomaly detected for user ${log.userId}: score=${result.anomalyScore}, signals=${result.signals.join(',')}`,
    );
  }
}
