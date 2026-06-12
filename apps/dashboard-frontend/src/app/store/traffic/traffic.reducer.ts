import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { TrafficLog } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { TrafficActions } from './traffic.actions';

export const MAX_TRAFFIC_LOGS = 100;

export const trafficAdapter = createEntityAdapter<TrafficLog>({
  selectId: (log) => log.id,
  sortComparer: (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
});

export type TrafficState = EntityState<TrafficLog>;

export const initialTrafficState: TrafficState = trafficAdapter.getInitialState();

export const trafficFeatureKey = 'traffic';

function trimExcess(state: TrafficState): TrafficState {
  const excess = state.ids.length - MAX_TRAFFIC_LOGS;
  if (excess <= 0) {
    return state;
  }

  const idsToRemove = state.ids.slice(MAX_TRAFFIC_LOGS) as string[];
  return trafficAdapter.removeMany(idsToRemove, state);
}

export const trafficReducer = createReducer(
  initialTrafficState,

  on(TrafficActions.insertLog, (state, { log }) =>
    trimExcess(trafficAdapter.addOne(log, state)),
  ),

  on(TrafficActions.updateLog, (state, { log }) =>
    trafficAdapter.updateOne({ id: log.id, changes: log }, state),
  ),

  on(TrafficActions.clearLogs, AuthActions.logoutSuccess, AuthActions.sessionExpired, () =>
    initialTrafficState,
  ),
);
