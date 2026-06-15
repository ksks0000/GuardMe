import { Global, Module } from '@nestjs/common';
import { SiemController } from './siem.controller';
import { SiemService } from './siem.service';

@Global()
@Module({
  controllers: [SiemController],
  providers: [SiemService],
  exports: [SiemService],
})
export class SiemModule {}
