import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { catchError, exhaustMap, filter, interval, map, mergeMap, of, startWith, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { mapAuthError } from '../../core/utils/auth-error.util';
import { isReAuthStale } from '../../core/utils/re-auth.util';
import { sanitizeReturnUrl } from '../../core/utils/return-url.util';
import { ReauthDialogComponent } from '../../shared/components/reauth-dialog/reauth-dialog.component';
import { AuthActions } from './auth.actions';
import { selectAuthUser, selectIsAuthenticated } from './auth.selectors';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(Store);

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

  readonly verifyPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyPassword),
      switchMap(({ password }) =>
        this.authApi.verifyPassword(password).pipe(
          map(({ lastAuthAt }) => AuthActions.verifyPasswordSuccess({ lastAuthAt })),
          catchError((error) =>
            of(
              AuthActions.verifyPasswordFailure({
                error: mapAuthError(error, 'verifyPassword'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly verifyPasswordCloseDialog$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.verifyPasswordSuccess),
        tap(() => {
          this.dialog.openDialogs
            .filter((ref) => ref.componentInstance instanceof ReauthDialogComponent)
            .forEach((ref) => ref.close(true));
        }),
      ),
    { dispatch: false },
  );

  readonly promptReAuthWhenStale$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthActions.loginSuccess,
        AuthActions.loadProfileSuccess,
        AuthActions.verifyPasswordSuccess,
      ),
      switchMap(() =>
        interval(30000).pipe(
          startWith(0),
          withLatestFrom(
            this.store.select(selectIsAuthenticated),
            this.store.select(selectAuthUser),
          ),
          mergeMap(([, isAuthenticated, user]) => {
            const actions: Action[] = [AuthActions.reauthStaleCheck()];
            if (isAuthenticated && isReAuthStale(user?.lastAuthAt ?? null)) {
              actions.push(AuthActions.reauthRequired());
            }
            return actions;
          }),
          takeUntil(
            this.actions$.pipe(
              ofType(AuthActions.logoutSuccess, AuthActions.sessionExpired),
            ),
          ),
        ),
      ),
    ),
  );

  readonly openReAuthDialog$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.reauthRequired),
        exhaustMap(() => {
          const alreadyOpen = this.dialog.openDialogs.some(
            (ref) => ref.componentInstance instanceof ReauthDialogComponent,
          );
          if (alreadyOpen) {
            return of(false);
          }

          this.store.dispatch(AuthActions.clearError());

          const dialogRef = this.dialog.open(ReauthDialogComponent, {
            disableClose: true,
            width: '26rem',
            autoFocus: 'first-tabbable',
          });

          return dialogRef.afterClosed();
        }),
        filter((verified): verified is boolean => verified === true),
        tap(() => {
          // Dialog closed after successful verify password
        }),
      ),
    { dispatch: false },
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
