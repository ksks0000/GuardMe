import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SecurityEvent, TrafficLog } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { SIEM_EMIT_EVENTS } from '../../config/siem.config';
import { WEBSOCKET_CLIENT_EVENTS, websocketConfig, WEBSOCKET_INTERNAL_EVENTS } from '../../config/websocket.config';
import { NOTIFICATION_EMIT_EVENTS } from '../../config/notification.config';
import { ThreatNotificationEmitPayload } from '../notifications/dto/threat-notification-emit.payload';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { SystemStatusService } from '../health/system-status.service';
import { SessionEventPayload } from './dto/session-event.payload';
import { WsAuthService } from './ws-auth.service';
import { toSecurityEventPayload, toTrafficLogPayload } from './utils/payload-mapper.util';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
  };
}

@Injectable()
@WebSocketGateway({
  namespace: websocketConfig.namespace(),
  cors: {
    origin: websocketConfig.corsOrigins(),
    credentials: true,
  },
})
export class EventsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  private readonly logger = new Logger(EventsGateway.name);
  private statusInterval?: NodeJS.Timeout;

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuthService: WsAuthService,
    private readonly systemStatusService: SystemStatusService,
  ) {}

  onModuleInit(): void {
    this.statusInterval = setInterval(() => {
      void this.broadcastSystemStatus();
    }, websocketConfig.systemStatusIntervalMs());
  }

  onModuleDestroy(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  afterInit(): void {
    this.logger.log(
      `WebSocket gateway ready on namespace ${websocketConfig.namespace()}`,
    );
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const user = await this.wsAuthService.authenticateSocket(client);
      client.data.user = user;
      await client.join(this.userRoom(user.userId));
      await client.join(this.authenticatedRoom());

      const status = await this.systemStatusService.getStatus();
      client.emit(WEBSOCKET_CLIENT_EVENTS.SYSTEM_STATUS, status);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.data.user) {
      this.logger.debug(
        `Client disconnected for user ${client.data.user.userId}`,
      );
    }
  }

  @OnEvent(SIEM_EMIT_EVENTS.TRAFFIC_LOG)
  handleTrafficLog(row: TrafficLog): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(this.userRoom(row.userId))
      .emit(WEBSOCKET_CLIENT_EVENTS.TRAFFIC_LOG, toTrafficLogPayload(row));
  }

  @OnEvent(SIEM_EMIT_EVENTS.SECURITY_EVENT)
  handleSecurityEvent(row: SecurityEvent): void {
    if (!this.server || !row.userId) {
      return;
    }

    this.server
      .to(this.userRoom(row.userId))
      .emit(WEBSOCKET_CLIENT_EVENTS.SECURITY_EVENT, toSecurityEventPayload(row));
  }

  @OnEvent(WEBSOCKET_INTERNAL_EVENTS.SESSION_EVENT)
  handleSessionEvent(payload: SessionEventPayload): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(this.userRoom(payload.userId))
      .emit(WEBSOCKET_CLIENT_EVENTS.SESSION_EVENT, payload);
  }

  @OnEvent(NOTIFICATION_EMIT_EVENTS.THREAT_NOTIFICATION)
  handleThreatNotification(payload: ThreatNotificationEmitPayload): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(this.userRoom(payload.userId))
      .emit(
        WEBSOCKET_CLIENT_EVENTS.THREAT_NOTIFICATION,
        payload.notification,
      );
  }

  private async broadcastSystemStatus(): Promise<void> {
    if (!this.server) {
      return;
    }

    const status = await this.systemStatusService.getStatus();
    this.server
      .to(this.authenticatedRoom())
      .emit(WEBSOCKET_CLIENT_EVENTS.SYSTEM_STATUS, status);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private authenticatedRoom(): string {
    return 'authenticated';
  }
}
