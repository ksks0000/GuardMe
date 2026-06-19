import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { throttleConfig } from './config/throttle.config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { ProxyRealmModule } from './modules/proxy/proxy-realm.module';
import { RulesModule } from './modules/rules/rules.module';
import { SiemModule } from './modules/siem/siem.module';
import { ThreatModule } from './modules/threat/threat.module';
import { VaultModule } from './modules/vault/vault.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: throttleConfig.ttlMs(),
        limit: throttleConfig.limit(),
      },
    ]),
    PrismaModule,
    CommonModule,
    SiemModule,
    ThreatModule,
    AuthModule,
    HealthModule,
    RulesModule,
    VaultModule,
    ProxyRealmModule,
    ProxyModule,
    WebsocketModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
