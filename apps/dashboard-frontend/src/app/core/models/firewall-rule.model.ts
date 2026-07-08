export const FIREWALL_RULE_TYPES = {
  DOMAIN: 'DOMAIN',
  IP: 'IP',
} as const;

export type FirewallRuleType =
  (typeof FIREWALL_RULE_TYPES)[keyof typeof FIREWALL_RULE_TYPES];

export const FIREWALL_RULE_ACTIONS = {
  BLOCK: 'BLOCK',
  ALLOW: 'ALLOW',
} as const;

export type FirewallRuleAction =
  (typeof FIREWALL_RULE_ACTIONS)[keyof typeof FIREWALL_RULE_ACTIONS];

export interface SystemPolicyRule {
  id: string;
  name: string;
  condition: string;
  action: FirewallRuleAction;
  source: 'system';
}

export interface FirewallRule {
  id: string;
  userId: string;
  name: string | null;
  ruleType: FirewallRuleType;
  pattern: string;
  action: FirewallRuleAction;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RulesListPayload {
  systemRules: SystemPolicyRule[];
  userRules: FirewallRule[];
}

export interface CreateFirewallRuleInput {
  name?: string;
  ruleType: FirewallRuleType;
  pattern: string;
  action: FirewallRuleAction;
  enabled?: boolean;
}

export interface UpdateFirewallRuleInput {
  name?: string;
  ruleType?: FirewallRuleType;
  pattern?: string;
  action?: FirewallRuleAction;
  enabled?: boolean;
}
