import { Module } from '@nestjs/common';
import { AnomalyService } from './anomaly.service';
import { BaselineService } from './baseline.service';
import { UebaController } from './ueba.controller';
import { UebaListener } from './ueba.listener';

@Module({
  controllers: [UebaController],
  providers: [BaselineService, AnomalyService, UebaListener],
  exports: [BaselineService, AnomalyService],
})
export class UebaModule {}
