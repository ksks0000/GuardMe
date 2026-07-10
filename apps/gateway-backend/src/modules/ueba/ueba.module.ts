import { Module } from '@nestjs/common';
import { AnomalyService } from './anomaly.service';
import { BaselineService } from './baseline.service';
import { UebaAnalyticsService } from './ueba-analytics.service';
import { UebaController } from './ueba.controller';
import { UebaListener } from './ueba.listener';

@Module({
  controllers: [UebaController],
  providers: [BaselineService, AnomalyService, UebaAnalyticsService, UebaListener],
  exports: [BaselineService, AnomalyService],
})
export class UebaModule {}
