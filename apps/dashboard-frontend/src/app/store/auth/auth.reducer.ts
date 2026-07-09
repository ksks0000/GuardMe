import { createReducer, on } from '@ngrx/store';
import { mapSessionError } from '../../core/utils/auth-error.util';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authFeatureKey = 'auth';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, AuthActions.register, (state) => ({
    ...state,
    status: 'loading' as const,
    error: null,
  })),

  on(AuthActions.loadProfile, (state) => ({
    ...state,
    status: state.user ? state.status : ('loading' as const),
    error: null,
  })),

  on(AuthActions.loginSuccess, AuthActions.loadProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    status: 'authenticated' as const,
    error: null,
    initialized: true,
  })),

  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    status: 'unauthenticated' as const,
    error,
    initialized: true,
  })),

  on(AuthActions.loadProfileFailure, AuthActions.logoutSuccess, (state) => ({
    ...state,
    user: null,
    status: 'unauthenticated' as const,
    error: null,
    initialized: true,
  })),

  on(AuthActions.sessionExpired, (state) => ({
    ...state,
    user: null,
    status: 'unauthenticated' as const,
    error: mapSessionError(),
    initialized: true,
    verifyPasswordLoading: false,
  })),

  on(AuthActions.verifyPassword, (state) => ({
    ...state,
    verifyPasswordLoading: true,
    verifyPasswordError: null,
  })),

  on(AuthActions.verifyPasswordSuccess, (state, { lastAuthAt }) => ({
    ...state,
    verifyPasswordLoading: false,
    verifyPasswordError: null,
    user: state.user ? { ...state.user, lastAuthAt } : null,
  })),

  on(AuthActions.verifyPasswordFailure, (state, { error }) => ({
    ...state,
    verifyPasswordLoading: false,
    verifyPasswordError: error,
  })),

  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
    verifyPasswordError: null,
  })),

  on(AuthActions.reauthStaleCheck, (state) => ({
    ...state,
    reAuthCheckedAt: Date.now(),
  })),
);
