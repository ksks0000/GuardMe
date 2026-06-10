import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HealthModule } from '../health/health.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { EventsGateway } from './events.gateway';
import { WsAuthService } from './ws-auth.service';

@Module({
  imports: [AuthModule, SessionsModule, UsersModule, HealthModule],
  providers: [EventsGateway, WsAuthService],
  exports: [EventsGateway],
})
export class WebsocketModule {}
