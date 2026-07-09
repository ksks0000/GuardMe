import { Module } from '@nestjs/common';
import { BaselineService } from './baseline.service';
import { UebaController } from './ueba.controller';

@Module({
  controllers: [UebaController],
  providers: [BaselineService],
  exports: [BaselineService],
})
export class UebaModule {}
