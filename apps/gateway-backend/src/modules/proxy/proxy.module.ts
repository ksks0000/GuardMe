import { Module } from '@nestjs/common';
import { BlockPageService } from './block-page.service';
import { PolicyService } from './policy.service';
import { WarningPageService } from './warning-page.service';

@Module({
  providers: [PolicyService, BlockPageService, WarningPageService],
  exports: [PolicyService, BlockPageService, WarningPageService],
})
export class ProxyModule {}
