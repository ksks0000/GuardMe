import { createReducer, on } from '@ngrx/store';
import { SystemStatus } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { SystemStatusActions } from './system-status.actions';

export interface SystemStatusState {
  current: SystemStatus | null;
}

export const initialSystemStatusState: SystemStatusState = {
  current: null,
};

export const systemStatusFeatureKey = 'systemStatus';

export const systemStatusReducer = createReducer(
  initialSystemStatusState,

  on(SystemStatusActions.updateStatus, (state, { status }) => ({
    ...state,
    current: status,
  })),

  on(
    SystemStatusActions.clearStatus,
    AuthActions.logoutSuccess,
    AuthActions.sessionExpired,
    () => initialSystemStatusState,
  ),
);
