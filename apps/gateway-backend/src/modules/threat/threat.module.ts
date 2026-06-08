import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { threatConfig } from '../../config/threat.config';
import { VirusTotalProvider } from './providers/virustotal.provider';
import { ThreatService } from './threat.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: threatConfig.scanTimeoutMs(),
      maxRedirects: 0,
    }),
  ],
  providers: [VirusTotalProvider, ThreatService],
  exports: [ThreatService],
})
export class ThreatModule {}
