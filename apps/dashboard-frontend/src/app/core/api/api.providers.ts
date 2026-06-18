import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AuthApi } from './auth.api';
import { HttpAuthApi } from './http/http-auth.api';
import { HttpRulesApi } from './http/http-rules.api';
import { HttpSiemApi } from './http/http-siem.api';
import { HttpVaultApi } from './http/http-vault.api';
import { SocketRealtimeApi } from './http/socket-realtime.api';
import { RealtimeApi } from './realtime.api';
import { RulesApi } from './rules.api';
import { SiemApi } from './siem.api';
import { VaultApi } from './vault.api';

export function provideGuardMeApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: HttpAuthApi },
    { provide: SiemApi, useClass: HttpSiemApi },
    { provide: RulesApi, useClass: HttpRulesApi },
    { provide: VaultApi, useClass: HttpVaultApi },
    { provide: RealtimeApi, useClass: SocketRealtimeApi },
  ]);
}
