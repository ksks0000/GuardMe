import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { VaultApi } from '../../core/api/vault.api';
import { mapVaultError } from '../../core/utils/vault-error.util';
import { VaultActions } from './vault.actions';

@Injectable()
export class VaultEffects {
  private readonly actions$ = inject(Actions);
  private readonly vaultApi = inject(VaultApi);

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

  readonly loadCredentialsAfterUnlock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VaultActions.unlockVaultSuccess, VaultActions.loadStatusSuccess),
      filter(({ locked }) => !locked),
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
}
