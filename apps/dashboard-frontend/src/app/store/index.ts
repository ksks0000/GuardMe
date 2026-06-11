import { EnvironmentProviders, isDevMode } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AuthEffects } from './auth/auth.effects';
import { authFeatureKey, authReducer } from './auth/auth.reducer';

export function provideAppStore(): EnvironmentProviders[] {
  return [
    provideStore(),
    provideState(authFeatureKey, authReducer),
    provideEffects(AuthEffects),
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
