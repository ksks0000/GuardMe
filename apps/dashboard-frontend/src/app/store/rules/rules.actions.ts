import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateFirewallRuleInput,
  FirewallRule,
  SystemPolicyRule,
  UpdateFirewallRuleInput,
} from '../../core/models';

export const RulesActions = createActionGroup({
  source: 'Rules',
  events: {
    'Load Rules': emptyProps(),
    'Load Rules Success': props<{
      systemRules: SystemPolicyRule[];
      userRules: FirewallRule[];
    }>(),
    'Load Rules Failure': props<{ error: string }>(),
    'Create Rule': props<{ input: CreateFirewallRuleInput }>(),
    'Create Rule Success': props<{ rule: FirewallRule }>(),
    'Create Rule Failure': props<{ error: string }>(),
    'Update Rule': props<{ id: string; input: UpdateFirewallRuleInput }>(),
    'Update Rule Success': props<{ rule: FirewallRule }>(),
    'Update Rule Failure': props<{ error: string }>(),
    'Delete Rule': props<{ id: string }>(),
    'Delete Rule Success': props<{ id: string }>(),
    'Delete Rule Failure': props<{ error: string }>(),
    'Clear Error': emptyProps(),
  },
});
