import { SystemPolicyRule } from '../../../config/policy.config';

export interface FirewallRulePayload {
  id: string;
  userId: string;
  name: string | null;
  ruleType: string;
  pattern: string;
  action: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RulesListPayload {
  systemRules: SystemPolicyRule[];
  userRules: FirewallRulePayload[];
}
