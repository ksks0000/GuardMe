import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { mapAuthError } from '../../core/utils/auth-error.util';
import { sanitizeReturnUrl } from '../../core/utils/return-url.util';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  readonly appInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.appInit),
      map(() => AuthActions.loadProfile()),
    ),
  );

  readonly loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadProfile),
      exhaustMap(() =>
        this.authApi.getProfile().pipe(
          map((user) => AuthActions.loadProfileSuccess({ user })),
          catchError(() => of(AuthActions.loadProfileFailure())),
        ),
      ),
    ),
  );

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials, returnUrl }) =>
        this.authApi.login(credentials).pipe(
          map((user) => AuthActions.loginSuccess({ user, returnUrl })),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: mapAuthError(error, 'login') })),
          ),
        ),
      ),
    ),
  );

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ credentials }) =>
        this.authApi.register(credentials).pipe(
          switchMap(() => this.authApi.login(credentials)),
          map((user) => AuthActions.loginSuccess({ user, returnUrl: '/dashboard' })),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: mapAuthError(error, 'register') })),
          ),
        ),
      ),
    ),
  );

  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authApi.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())),
        ),
      ),
    ),
  );

  readonly loginSuccessNavigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ returnUrl }) => {
          void this.router.navigateByUrl(sanitizeReturnUrl(returnUrl));
        }),
      ),
    { dispatch: false },
  );

  readonly logoutNavigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess, AuthActions.sessionExpired),
        tap(() => {
          void this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );
}
