import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth.api';
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

export function provideGuardMeApi(): EnvironmentProviders {
  if (environment.useMocks) {
    return makeEnvironmentProviders([
      { provide: AuthApi, useClass: MockAuthApi },
      { provide: SiemApi, useClass: MockSiemApi },
      { provide: RealtimeApi, useClass: MockRealtimeApi },
    ]);
  }

  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: UnconfiguredAuthApi },
    { provide: SiemApi, useClass: UnconfiguredSiemApi },
    { provide: RealtimeApi, useClass: UnconfiguredRealtimeApi },
  ]);
}
