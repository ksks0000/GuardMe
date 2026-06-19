import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SecurityEvent, TrafficLog } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { SIEM_EMIT_EVENTS } from '../../config/siem.config';
import {
  WEBSOCKET_CLIENT_EVENTS,
  WEBSOCKET_INTERNAL_EVENTS,
  websocketConfig,
} from '../../config/websocket.config';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { SystemStatusService } from '../health/system-status.service';
import { UsersService } from '../users/users.service';
import { readSecurityEventMetadata } from '../siem/utils/security-event-user-scope.util';
import { SessionEventPayload } from './dto/session-event.payload';
import { WsAuthService } from './ws-auth.service';
import {
  toSecurityEventPayload,
  toTrafficLogPayload,
} from './utils/payload-mapper.util';

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
    private readonly usersService: UsersService,
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
  async handleSecurityEvent(row: SecurityEvent): Promise<void> {
    if (!this.server) {
      return;
    }

    const recipientUserIds = await this.resolveSecurityEventRecipients(
      row.metadata,
    );
    if (recipientUserIds.length === 0) {
      return;
    }

    const payload = toSecurityEventPayload(row);
    for (const userId of recipientUserIds) {
      this.server
        .to(this.userRoom(userId))
        .emit(WEBSOCKET_CLIENT_EVENTS.SECURITY_EVENT, payload);
    }
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

  private async resolveSecurityEventRecipients(
    metadata: SecurityEvent['metadata'],
  ): Promise<string[]> {
    const { userId, username } = readSecurityEventMetadata(metadata ?? null);
    if (userId) {
      return [userId];
    }

    if (!username) {
      return [];
    }

    const user = await this.usersService.findByUsername(username);
    return user ? [user.id] : [];
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
