import { Global, Module } from '@nestjs/common';
import { SiemService } from './siem.service';

@Global()
@Module({
  providers: [SiemService],
  exports: [SiemService],
})
export class SiemModule {}
