import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { VaultApi } from '../../core/api/vault.api';
import { mapVaultError } from '../../core/utils/vault-error.util';
import {
  ViewPasswordDialogComponent,
  ViewPasswordDialogData,
} from '../../features/vault/view-password-dialog/view-password-dialog.component';
import { VaultActions } from './vault.actions';
import { selectAllCredentials } from './vault.selectors';

@Injectable()
export class VaultEffects {
  private readonly actions$ = inject(Actions);
  private readonly vaultApi = inject(VaultApi);
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly loadStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.loadStatus),
      switchMap(() =>
        this.vaultApi.getStatus().pipe(
          map(({ locked }) => VaultActions.loadStatusSuccess({ locked })),
          catchError((error) =>
            of(VaultActions.loadStatusFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly loadCredentialsOnReady$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.loadStatusSuccess, VaultActions.unlockVaultSuccess),
      filter((action) =>
        action.type === VaultActions.unlockVaultSuccess.type ? true : !action.locked,
      ),
      map(() => VaultActions.loadCredentials()),
    ),
  );

  readonly unlockVault$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.unlockVault),
      switchMap(({ password }) =>
        this.vaultApi.unlock(password).pipe(
          map(({ locked }) => VaultActions.unlockVaultSuccess({ locked })),
          catchError((error) =>
            of(VaultActions.unlockVaultFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly lockVault$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.lockVault),
      switchMap(() =>
        this.vaultApi.lock().pipe(
          map(({ locked }) => VaultActions.lockVaultSuccess({ locked })),
          catchError((error) =>
            of(VaultActions.lockVaultFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly loadCredentials$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.loadCredentials),
      switchMap(() =>
        this.vaultApi.listCredentials().pipe(
          map((credentials) => VaultActions.loadCredentialsSuccess({ credentials })),
          catchError((error) =>
            of(VaultActions.loadCredentialsFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly createCredential$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.createCredential),
      switchMap(({ input }) =>
        this.vaultApi.createCredential(input).pipe(
          map((credential) => VaultActions.createCredentialSuccess({ credential })),
          catchError((error) =>
            of(VaultActions.createCredentialFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly updateCredential$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.updateCredential),
      switchMap(({ id, input }) =>
        this.vaultApi.updateCredential(id, input).pipe(
          map((credential) => VaultActions.updateCredentialSuccess({ credential })),
          catchError((error) =>
            of(VaultActions.updateCredentialFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly deleteCredential$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.deleteCredential),
      switchMap(({ id }) =>
        this.vaultApi.deleteCredential(id).pipe(
          map(() => VaultActions.deleteCredentialSuccess({ id })),
          catchError((error) =>
            of(VaultActions.deleteCredentialFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly revealCredential$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.revealCredential),
      switchMap(({ id }) =>
        this.vaultApi.getCredential(id).pipe(
          map((detail) =>
            VaultActions.revealCredentialSuccess({ id, password: detail.password }),
          ),
          catchError((error) =>
            of(VaultActions.revealCredentialFailure({ error: mapVaultError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly showRevealedPasswordDialog$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(VaultActions.revealCredentialSuccess),
        withLatestFrom(this.store.select(selectAllCredentials)),
        tap(([{ id, password }, credentials]) => {
          const credential = credentials.find((entry) => entry.id === id);
          if (!credential) {
            return;
          }

          this.dialog.open<ViewPasswordDialogComponent, ViewPasswordDialogData>(
            ViewPasswordDialogComponent,
            {
              width: '26rem',
              data: {
                serviceName: credential.serviceName,
                username: credential.username,
                password,
              },
            },
          );
        }),
      ),
    { dispatch: false },
  );
}
