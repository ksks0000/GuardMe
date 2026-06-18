import { createFeatureSelector, createSelector } from '@ngrx/store';
import { credentialsAdapter, vaultFeatureKey, VaultState } from './vault.reducer';

export const selectVaultState = createFeatureSelector<VaultState>(vaultFeatureKey);

const credentialSelectors = credentialsAdapter.getSelectors(
  createSelector(selectVaultState, (state) => state.credentials),
);

export const selectAllCredentials = credentialSelectors.selectAll;

export const selectVaultLocked = createSelector(selectVaultState, (state) => state.locked);

export const selectVaultStatusLoaded = createSelector(
  selectVaultState,
  (state) => state.statusLoaded,
);

export const selectVaultLoading = createSelector(selectVaultState, (state) => state.loading);

export const selectVaultSaving = createSelector(selectVaultState, (state) => state.saving);

export const selectVaultUnlocking = createSelector(selectVaultState, (state) => state.unlocking);

export const selectVaultError = createSelector(selectVaultState, (state) => state.error);

export const selectVaultUnlockError = createSelector(
  selectVaultState,
  (state) => state.unlockError,
);

export const selectRevealedPasswords = createSelector(
  selectVaultState,
  (state) => state.revealedPasswords,
);

export const selectRevealedPassword = (id: string) =>
  createSelector(selectRevealedPasswords, (passwords) => passwords[id] ?? null);
