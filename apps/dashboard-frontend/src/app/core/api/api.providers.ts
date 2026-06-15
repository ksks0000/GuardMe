import { EnvironmentProviders, makeEnvironmentProviders, Type } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth.api';
import { HttpAuthApi } from './http/http-auth.api';
import { MockAuthApi } from './mock/mock-auth.api';
import { MockRealtimeApi } from './mock/mock-realtime.api';
import { MockSiemApi } from './mock/mock-siem.api';
import { RealtimeApi } from './realtime.api';
import { SiemApi } from './siem.api';
import {
  UnconfiguredAuthApi,
  UnconfiguredRealtimeApi,
  UnconfiguredSiemApi,
} from './unconfigured-api.stubs';

function resolveAuthApi(): Type<AuthApi> {
  if (environment.useRealAuth || !environment.useMocks) {
    return HttpAuthApi;
  }

  return MockAuthApi;
}

function resolveSiemApi(): Type<SiemApi> {
  return environment.useMocks ? MockSiemApi : UnconfiguredSiemApi;
}

function resolveRealtimeApi(): Type<RealtimeApi> {
  return environment.useMocks ? MockRealtimeApi : UnconfiguredRealtimeApi;
}

export function provideGuardMeApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: resolveAuthApi() },
    { provide: SiemApi, useClass: resolveSiemApi() },
    { provide: RealtimeApi, useClass: resolveRealtimeApi() },
  ]);
}
