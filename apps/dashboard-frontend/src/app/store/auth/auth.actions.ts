import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginCredentials, RegisterCredentials, UserProfile } from '../../core/models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'App Init': emptyProps(),
    'Login': props<{ credentials: LoginCredentials; returnUrl?: string }>(),
    'Login Success': props<{ user: UserProfile; returnUrl?: string }>(),
    'Login Failure': props<{ error: string }>(),
    'Register': props<{ credentials: RegisterCredentials }>(),
    'Register Failure': props<{ error: string }>(),
    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Load Profile': emptyProps(),
    'Load Profile Success': props<{ user: UserProfile }>(),
    'Load Profile Failure': emptyProps(),
    'Session Expired': emptyProps(),
    'Reauth Required': emptyProps(),
    'Verify Password': props<{ password: string }>(),
    'Verify Password Success': props<{ lastAuthAt: string }>(),
    'Verify Password Failure': props<{ error: string }>(),
    'Clear Error': emptyProps(),
  },
});
