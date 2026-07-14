import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isInvalidPasswordError, isReAuthRequiredError } from '../utils/auth-error.util';
import { isApiRequest } from '../utils/api-request.util';
import { AuthActions } from '../../store/auth/auth.actions';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const targetsApi = isApiRequest(req.url);
  const isAuthBootstrap =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/me') ||
    req.url.includes('/auth/verify-password');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        targetsApi &&
        !isAuthBootstrap &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        if (isReAuthRequiredError(error)) {
          store.dispatch(AuthActions.reauthRequired());
        } else if (!isInvalidPasswordError(error)) {
          store.dispatch(AuthActions.sessionExpired());
        }
      }

      return throwError(() => error);
    }),
  );
};
