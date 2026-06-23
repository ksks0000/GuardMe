import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SystemStatusService } from './system-status.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  controllers: [HealthController],
  providers: [SystemStatusService],
  exports: [SystemStatusService],
})
export class HealthModule {}
