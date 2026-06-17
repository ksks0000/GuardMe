import { createFeatureSelector, createSelector } from '@ngrx/store';
import { userRulesAdapter, rulesFeatureKey, RulesState } from './rules.reducer';

export const selectRulesState = createFeatureSelector<RulesState>(rulesFeatureKey);

const userRuleSelectors = userRulesAdapter.getSelectors(
  createSelector(selectRulesState, (state) => state.userRules),
);

export const selectSystemRules = createSelector(selectRulesState, (state) => state.systemRules);

export const selectAllUserRules = userRuleSelectors.selectAll;

export const selectRulesLoading = createSelector(selectRulesState, (state) => state.loading);

export const selectRulesSaving = createSelector(selectRulesState, (state) => state.saving);

export const selectRulesLoaded = createSelector(selectRulesState, (state) => state.loaded);

export const selectRulesError = createSelector(selectRulesState, (state) => state.error);

export const selectEnabledUserRulesCount = createSelector(selectAllUserRules, (rules) =>
  rules.filter((rule) => rule.enabled).length,
);
