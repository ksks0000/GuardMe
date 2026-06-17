import { EnvironmentProviders, makeEnvironmentProviders, Type } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth.api';
import { HttpAuthApi } from './http/http-auth.api';
import { HttpRulesApi } from './http/http-rules.api';
import { HttpSiemApi } from './http/http-siem.api';
import { SocketRealtimeApi } from './http/socket-realtime.api';
import { MockAuthApi } from './mock/mock-auth.api';
import { MockRealtimeApi } from './mock/mock-realtime.api';
import { MockRulesApi } from './mock/mock-rules.api';
import { MockSiemApi } from './mock/mock-siem.api';
import { RealtimeApi } from './realtime.api';
import { RulesApi } from './rules.api';
import { SiemApi } from './siem.api';

function resolveAuthApi(): Type<AuthApi> {
  if (environment.useRealAuth || !environment.useMocks) {
    return HttpAuthApi;
  }

  return MockAuthApi;
}

function resolveSiemApi(): Type<SiemApi> {
  if (environment.useRealSiem || !environment.useMocks) {
    return HttpSiemApi;
  }

  return MockSiemApi;
}

function resolveRulesApi(): Type<RulesApi> {
  if (environment.useRealRules || !environment.useMocks) {
    return HttpRulesApi;
  }

  return MockRulesApi;
}

function resolveRealtimeApi(): Type<RealtimeApi> {
  if (environment.useRealRealtime || !environment.useMocks) {
    return SocketRealtimeApi;
  }

  return MockRealtimeApi;
}

export function provideGuardMeApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: resolveAuthApi() },
    { provide: SiemApi, useClass: resolveSiemApi() },
    { provide: RulesApi, useClass: resolveRulesApi() },
    { provide: RealtimeApi, useClass: resolveRealtimeApi() },
  ]);
}
