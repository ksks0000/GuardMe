import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { SecurityEvent } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { SecurityEventsActions } from './security-events.actions';

export const MAX_SECURITY_EVENTS = 100;

export const securityEventsAdapter = createEntityAdapter<SecurityEvent>({
  selectId: (event) => event.id,
  sortComparer: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
});

export type SecurityEventsState = EntityState<SecurityEvent>;

export const initialSecurityEventsState: SecurityEventsState =
  securityEventsAdapter.getInitialState();

export const securityEventsFeatureKey = 'securityEvents';

function trimExcess(state: SecurityEventsState): SecurityEventsState {
  const excess = state.ids.length - MAX_SECURITY_EVENTS;
  if (excess <= 0) {
    return state;
  }

  const idsToRemove = state.ids.slice(MAX_SECURITY_EVENTS) as string[];
  return securityEventsAdapter.removeMany(idsToRemove, state);
}

export const securityEventsReducer = createReducer(
  initialSecurityEventsState,

  on(SecurityEventsActions.insertEvent, (state, { event }) =>
    trimExcess(securityEventsAdapter.addOne(event, state)),
  ),

  on(SecurityEventsActions.updateEvent, (state, { event }) =>
    securityEventsAdapter.updateOne({ id: event.id, changes: event }, state),
  ),

  on(
    SecurityEventsActions.clearEvents,
    AuthActions.logoutSuccess,
    AuthActions.sessionExpired,
    () => initialSecurityEventsState,
  ),
);
