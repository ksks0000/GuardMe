import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEnGb from '@angular/common/locales/en-GB';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';

import { routes } from './app.routes';
import { provideGuardMeApi } from './core/api';
import { httpInterceptors } from './core/interceptors';
import { provideAppStore } from './store';
import { AuthActions } from './store/auth/auth.actions';

registerLocaleData(localeEnGb);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(withInterceptors(httpInterceptors)),
    { provide: LOCALE_ID, useValue: 'en-GB' },
    ...provideAppStore(),
    provideGuardMeApi(),
    provideAppInitializer(() => {
      inject(Store).dispatch(AuthActions.appInit());
    }),
  ],
};
