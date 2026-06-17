import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { FirewallRule, SystemPolicyRule } from '../../core/models';
import { AuthActions } from '../auth/auth.actions';
import { RulesActions } from './rules.actions';

export const userRulesAdapter = createEntityAdapter<FirewallRule>({
  selectId: (rule) => rule.id,
  sortComparer: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
});

export interface RulesState {
  systemRules: SystemPolicyRule[];
  userRules: EntityState<FirewallRule>;
  loading: boolean;
  saving: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialRulesState: RulesState = {
  systemRules: [],
  userRules: userRulesAdapter.getInitialState(),
  loading: false,
  saving: false,
  loaded: false,
  error: null,
};

export const rulesFeatureKey = 'rules';

export const rulesReducer = createReducer(
  initialRulesState,

  on(RulesActions.loadRules, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(RulesActions.loadRulesSuccess, (state, { systemRules, userRules }) => ({
    ...state,
    loading: false,
    loaded: true,
    systemRules,
    userRules: userRulesAdapter.setAll(userRules, state.userRules),
  })),

  on(RulesActions.loadRulesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(
    RulesActions.createRule,
    RulesActions.updateRule,
    RulesActions.deleteRule,
    (state) => ({
      ...state,
      saving: true,
      error: null,
    }),
  ),

  on(RulesActions.createRuleSuccess, (state, { rule }) => ({
    ...state,
    saving: false,
    userRules: userRulesAdapter.addOne(rule, state.userRules),
  })),

  on(RulesActions.updateRuleSuccess, (state, { rule }) => ({
    ...state,
    saving: false,
    userRules: userRulesAdapter.upsertOne(rule, state.userRules),
  })),

  on(RulesActions.deleteRuleSuccess, (state, { id }) => ({
    ...state,
    saving: false,
    userRules: userRulesAdapter.removeOne(id, state.userRules),
  })),

  on(
    RulesActions.createRuleFailure,
    RulesActions.updateRuleFailure,
    RulesActions.deleteRuleFailure,
    (state, { error }) => ({
      ...state,
      saving: false,
      error,
    }),
  ),

  on(RulesActions.clearError, (state) => ({
    ...state,
    error: null,
  })),

  on(AuthActions.logoutSuccess, AuthActions.sessionExpired, () => initialRulesState),
);
