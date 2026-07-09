import { UserProfile } from '../../core/models';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;
  initialized: boolean;
  verifyPasswordLoading: boolean;
  verifyPasswordError: string | null;
  /** Updated every 30s so re-auth staleness selectors re-evaluate against Date.now(). */
  reAuthCheckedAt: number;
}

export const initialAuthState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
  verifyPasswordLoading: false,
  verifyPasswordError: null,
  reAuthCheckedAt: 0,
};
