import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { proxyConfig } from '../../config/proxy.config';
import { AuthModule } from '../auth/auth.module';
import { RulesModule } from '../rules/rules.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ThreatModule } from '../threat/threat.module';
import { UsersModule } from '../users/users.module';
import { BlockPageService } from './block-page.service';
import { BypassTokenService } from './bypass-token.service';
import { ConnectTunnelService } from './connect-tunnel.service';
import { InspectionService } from './inspection.service';
import { PolicyService } from './policy.service';
import { ProxyAuthService } from './proxy-auth.service';
import { ProxyForwardService } from './proxy-forward.service';
import { ProxyPipelineService } from './proxy-pipeline.service';
import { ProxyRateLimitService } from './proxy-rate-limit.service';
import { ThreatScanCacheService } from './threat-scan-cache.service';
import { WarningPageService } from './warning-page.service';

@Module({
  imports: [
    AuthModule,
    RulesModule,
    SessionsModule,
    UsersModule,
    ThreatModule,
    HttpModule.register({
      timeout: proxyConfig.forwardTimeoutMs(),
      maxRedirects: 0,
    }),
  ],
  providers: [
    PolicyService,
    BlockPageService,
    WarningPageService,
    InspectionService,
    ThreatScanCacheService,
    BypassTokenService,
    ProxyAuthService,
    ProxyRateLimitService,
    ProxyForwardService,
    ProxyPipelineService,
    ConnectTunnelService,
  ],
  exports: [
    PolicyService,
    BlockPageService,
    WarningPageService,
    ProxyAuthService,
    ProxyPipelineService,
    ConnectTunnelService,
  ],
})
export class ProxyModule {}
