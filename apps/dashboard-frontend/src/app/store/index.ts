import { EnvironmentProviders, isDevMode } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AuthEffects } from './auth/auth.effects';
import { authFeatureKey, authReducer } from './auth/auth.reducer';
import { RealtimeEffects } from './realtime/realtime.effects';
import {
  securityEventsFeatureKey,
  securityEventsReducer,
} from './security-events/security-events.reducer';
import {
  systemStatusFeatureKey,
  systemStatusReducer,
} from './system-status/system-status.reducer';
import { trafficFeatureKey, trafficReducer } from './traffic/traffic.reducer';

export function provideAppStore(): EnvironmentProviders[] {
  return [
    provideStore(),
    provideState(authFeatureKey, authReducer),
    provideState(trafficFeatureKey, trafficReducer),
    provideState(securityEventsFeatureKey, securityEventsReducer),
    provideState(systemStatusFeatureKey, systemStatusReducer),
    provideEffects(AuthEffects, RealtimeEffects),
    ...(isDevMode()
      ? [
          provideStoreDevtools({
            maxAge: 50,
            logOnly: !isDevMode(),
          }),
        ]
      : []),
  ];
}
