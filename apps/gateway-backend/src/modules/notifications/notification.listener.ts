import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SecurityEvent } from '@prisma/client';
import { DOMAIN_EVENTS } from '../../config/events.config';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(DOMAIN_EVENTS.SECURITY_EVENT_CREATED)
  handleSecurityEventCreated(row: SecurityEvent): void {
    this.notificationService.notifyFromSecurityEvent(row);
  }
}
