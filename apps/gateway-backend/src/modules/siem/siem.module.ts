import { Global, Module } from '@nestjs/common';
import { SiemAnalyticsService } from './siem-analytics.service';
import { SiemController } from './siem.controller';
import { SiemService } from './siem.service';

@Global()
@Module({
  controllers: [SiemController],
  providers: [SiemService, SiemAnalyticsService],
  exports: [SiemService],
})
export class SiemModule {}
