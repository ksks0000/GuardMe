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
  action: string;
  source: 'system';
}

export const policyConfig = {
  systemRules: (): SystemPolicyRule[] => [
    {
      id: 'system-malicious-block',
      name: 'Malicious URL block',
      condition: 'Threat verdict is MALICIOUS',
      action: 'BLOCK',
      source: 'system',
    },
    {
      id: 'system-suspicious-warn',
      name: 'Suspicious URL warning',
      condition: 'Threat verdict is SUSPICIOUS',
      action: 'WARN',
      source: 'system',
    },
    {
      id: 'system-safe-allow',
      name: 'Safe URL allow',
      condition: 'Threat verdict is SAFE',
      action: 'ALLOW',
      source: 'system',
    },
    {
      id: 'system-unverified-allow',
      name: 'Unverified URL allow (fail-open)',
      condition: 'Threat verdict is UNVERIFIED',
      action: 'ALLOW',
      source: 'system',
    },
    {
      id: 'system-malicious-file',
      name: 'Malicious file download block',
      condition: 'Simulated file scan verdict is MALICIOUS',
      action: 'BLOCK',
      source: 'system',
    },
  ],
};
