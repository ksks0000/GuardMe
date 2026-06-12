import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';

import { routes } from './app.routes';
import { provideGuardMeApi } from './core/api';
import { httpInterceptors } from './core/interceptors';
import { provideAppStore } from './store';
import { AuthActions } from './store/auth/auth.actions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors(httpInterceptors)),
    ...provideAppStore(),
    provideGuardMeApi(),
    provideAppInitializer(() => {
      inject(Store).dispatch(AuthActions.appInit());
    }),
  ],
};
