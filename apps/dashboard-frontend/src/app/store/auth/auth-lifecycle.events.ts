import { AuthActions } from './auth.actions';

export const AUTH_START_EVENTS = [
  AuthActions.loginSuccess,
  AuthActions.loadProfileSuccess,
] as const;

export const AUTH_END_EVENTS = [
  AuthActions.logoutSuccess,
  AuthActions.sessionExpired,
] as const;
