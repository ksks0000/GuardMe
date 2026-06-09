import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from '../../common/common.module';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SiemModule } from '../siem/siem.module';
import { ThreatModule } from '../threat/threat.module';
import { ProxyController } from './proxy.controller';
import { ProxyModule } from './proxy.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonModule,
    SiemModule,
    ThreatModule,
    AuthModule,
    ProxyModule,
  ],
  controllers: [ProxyController],
})
export class ProxyAppModule {}
