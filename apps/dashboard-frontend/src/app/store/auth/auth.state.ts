import { UserProfile } from '../../core/models';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;
  initialized: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
};
