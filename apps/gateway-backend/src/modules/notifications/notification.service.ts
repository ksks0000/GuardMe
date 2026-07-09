import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SecurityEvent } from '@prisma/client';
import {
  NOTIFIABLE_EVENT_TYPES,
  NOTIFICATION_EMIT_EVENTS,
  resolveNotificationTitle,
  sanitizeNotificationMetadata,
} from '../../config/notification.config';
import { SiemEventType } from '../../config/siem.config';
import { ThreatNotificationPayload, ThreatNotificationEmitPayload } from './dto/threat-notification.payload';

@Injectable()
export class NotificationService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  notifyFromSecurityEvent(row: SecurityEvent): void {
    if (!row.userId) {
      return;
    }

    if (!NOTIFIABLE_EVENT_TYPES.has(row.type as SiemEventType)) {
      return;
    }

    const notification = this.buildPayload(row);
    const emitPayload: ThreatNotificationEmitPayload = {
      userId: row.userId,
      notification,
    };

    this.eventEmitter.emit(
      NOTIFICATION_EMIT_EVENTS.THREAT_NOTIFICATION,
      emitPayload,
    );
  }

  private buildPayload(row: SecurityEvent): ThreatNotificationPayload {
    const type = row.type as SiemEventType;

    return {
      id: row.id,
      type,
      title: resolveNotificationTitle(type),
      message: row.message,
      severity: row.severity as ThreatNotificationPayload['severity'],
      timestamp: row.createdAt.toISOString(),
      metadata: sanitizeNotificationMetadata(row.metadata),
    };
  }
}
