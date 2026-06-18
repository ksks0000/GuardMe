import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { VaultCredentialSummary } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { VaultActions } from './vault.actions';

export const credentialsAdapter = createEntityAdapter<VaultCredentialSummary>({
  selectId: (credential) => credential.id,
  sortComparer: (a, b) => a.serviceName.localeCompare(b.serviceName),
});

export interface VaultState {
  locked: boolean;
  statusLoaded: boolean;
  credentials: EntityState<VaultCredentialSummary>;
  revealedPasswords: Record<string, string>;
  loading: boolean;
  saving: boolean;
  unlocking: boolean;
  error: string | null;
  unlockError: string | null;
}

export const initialVaultState: VaultState = {
  locked: true,
  statusLoaded: false,
  credentials: credentialsAdapter.getInitialState(),
  revealedPasswords: {},
  loading: false,
  saving: false,
  unlocking: false,
  error: null,
  unlockError: null,
};

export const vaultFeatureKey = 'vault';

export const vaultReducer = createReducer(
  initialVaultState,

  on(VaultActions.loadStatus, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(VaultActions.loadStatusSuccess, (state, { locked }) => ({
    ...state,
    loading: false,
    statusLoaded: true,
    locked,
  })),

  on(VaultActions.loadStatusFailure, (state, { error }) => ({
    ...state,
    loading: false,
    statusLoaded: true,
    error,
  })),

  on(VaultActions.unlockVault, (state) => ({
    ...state,
    unlocking: true,
    unlockError: null,
  })),

  on(VaultActions.unlockVaultSuccess, (state, { locked }) => ({
    ...state,
    unlocking: false,
    locked,
    unlockError: null,
  })),

  on(VaultActions.unlockVaultFailure, (state, { error }) => ({
    ...state,
    unlocking: false,
    unlockError: error,
  })),

  on(VaultActions.lockVault, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),

  on(VaultActions.lockVaultSuccess, (state, { locked }) => ({
    ...state,
    saving: false,
    locked,
    revealedPasswords: {},
  })),

  on(VaultActions.lockVaultFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(VaultActions.loadCredentials, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(VaultActions.loadCredentialsSuccess, (state, { credentials }) => ({
    ...state,
    loading: false,
    credentials: credentialsAdapter.setAll(credentials, state.credentials),
  })),

  on(VaultActions.loadCredentialsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(
    VaultActions.createCredential,
    VaultActions.updateCredential,
    VaultActions.deleteCredential,
    VaultActions.revealCredential,
    (state) => ({
      ...state,
      saving: true,
      error: null,
    }),
  ),

  on(VaultActions.createCredentialSuccess, (state, { credential }) => ({
    ...state,
    saving: false,
    credentials: credentialsAdapter.addOne(credential, state.credentials),
  })),

  on(VaultActions.updateCredentialSuccess, (state, { credential }) => ({
    ...state,
    saving: false,
    credentials: credentialsAdapter.upsertOne(credential, state.credentials),
    revealedPasswords: omitKey(state.revealedPasswords, credential.id),
  })),

  on(VaultActions.deleteCredentialSuccess, (state, { id }) => ({
    ...state,
    saving: false,
    credentials: credentialsAdapter.removeOne(id, state.credentials),
    revealedPasswords: omitKey(state.revealedPasswords, id),
  })),

  on(VaultActions.revealCredentialSuccess, (state, { id, password }) => ({
    ...state,
    saving: false,
    revealedPasswords: { ...state.revealedPasswords, [id]: password },
  })),

  on(
    VaultActions.createCredentialFailure,
    VaultActions.updateCredentialFailure,
    VaultActions.deleteCredentialFailure,
    VaultActions.revealCredentialFailure,
    (state, { error }) => ({
      ...state,
      saving: false,
      error,
    }),
  ),

  on(VaultActions.clearRevealedPassword, (state, { id }) => ({
    ...state,
    revealedPasswords: omitKey(state.revealedPasswords, id),
  })),

  on(VaultActions.clearAllRevealedPasswords, (state) => ({
    ...state,
    revealedPasswords: {},
  })),

  on(VaultActions.clearError, (state) => ({
    ...state,
    error: null,
  })),

  on(VaultActions.clearUnlockError, (state) => ({
    ...state,
    unlockError: null,
  })),

  on(AuthActions.logout, AuthActions.logoutSuccess, AuthActions.sessionExpired, () =>
    initialVaultState,
  ),
);

function omitKey(
  record: Record<string, string>,
  key: string,
): Record<string, string> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}
