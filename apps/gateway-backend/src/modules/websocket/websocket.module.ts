import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { EventsGateway } from './events.gateway';
import { SystemStatusService } from './system-status.service';
import { WsAuthService } from './ws-auth.service';

@Module({
  imports: [
    AuthModule,
    SessionsModule,
    UsersModule,
    HttpModule.register({ timeout: 5_000 }),
  ],
  providers: [EventsGateway, WsAuthService, SystemStatusService],
  exports: [EventsGateway],
})
export class WebsocketModule {}
