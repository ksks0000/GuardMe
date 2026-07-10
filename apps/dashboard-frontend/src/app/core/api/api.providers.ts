import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AnalyticsApi } from './analytics.api';
import { AuthApi } from './auth.api';
import { HttpAnalyticsApi } from './http/http-analytics.api';
import { HttpAuthApi } from './http/http-auth.api';
import { HttpRulesApi } from './http/http-rules.api';
import { HttpSiemApi } from './http/http-siem.api';
import { HttpVaultApi } from './http/http-vault.api';
import { HttpUebaApi } from './http/http-ueba.api';
import { SocketRealtimeApi } from './http/socket-realtime.api';
import { RealtimeApi } from './realtime.api';
import { RulesApi } from './rules.api';
import { SiemApi } from './siem.api';
import { UebaApi } from './ueba.api';
import { VaultApi } from './vault.api';

export function provideGuardMeApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: HttpAuthApi },
    { provide: SiemApi, useClass: HttpSiemApi },
    { provide: RulesApi, useClass: HttpRulesApi },
    { provide: VaultApi, useClass: HttpVaultApi },
    { provide: AnalyticsApi, useClass: HttpAnalyticsApi },
    { provide: UebaApi, useClass: HttpUebaApi },
    { provide: RealtimeApi, useClass: SocketRealtimeApi },
  ]);
}
