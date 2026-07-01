import { createFeatureSelector, createSelector } from '@ngrx/store';
import { isReAuthStale } from '../../core/utils/re-auth.util';
import { authFeatureKey } from './auth.reducer';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>(authFeatureKey);

export const selectAuthUser = createSelector(selectAuthState, (state) => state.user);

export const selectUsername = createSelector(selectAuthUser, (user) => user?.username ?? null);

export const selectLastAuthAt = createSelector(selectAuthUser, (user) => user?.lastAuthAt ?? null);

export const selectReAuthStaleTick = createSelector(
  selectAuthState,
  (state) => state.reAuthStaleTick,
);

export const selectIsReAuthStale = createSelector(
  selectLastAuthAt,
  selectReAuthStaleTick,
  (lastAuthAt) => isReAuthStale(lastAuthAt),
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.status === 'authenticated' && state.user !== null,
);

export const selectAuthInitialized = createSelector(selectAuthState, (state) => state.initialized);

export const selectAuthLoading = createSelector(selectAuthState, (state) => state.status === 'loading');

export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

export const selectVerifyPasswordLoading = createSelector(
  selectAuthState,
  (state) => state.verifyPasswordLoading,
);

export const selectVerifyPasswordError = createSelector(
  selectAuthState,
  (state) => state.verifyPasswordError,
);
