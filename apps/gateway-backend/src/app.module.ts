import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SiemModule } from './modules/siem/siem.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { ThreatModule } from './modules/threat/threat.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonModule,
    SiemModule,
    ThreatModule,
    ProxyModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
