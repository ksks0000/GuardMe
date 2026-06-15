import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthActions } from '../../store/auth/auth.actions';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const isAuthBootstrap =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/me');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        isApiRequest &&
        !isAuthBootstrap &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        store.dispatch(AuthActions.sessionExpired());
      }

      return throwError(() => error);
    }),
  );
};
