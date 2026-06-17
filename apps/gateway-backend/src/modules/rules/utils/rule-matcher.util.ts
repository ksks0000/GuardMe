import { FirewallRule } from '@prisma/client';
import { FIREWALL_RULE_ACTIONS, FirewallRuleAction } from '../../../config/policy.config';

export interface RuleMatchContext {
  destinationHost: string;
  destinationIp?: string | null;
}

export interface RuleMatchResult {
  ruleId: string;
  ruleName: string | null;
  ruleType: string;
  pattern: string;
  action: FirewallRuleAction;
}

const DOMAIN_PATTERN_MAX = 253;
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

export function normalizeRulePattern(
  ruleType: string,
  pattern: string,
): string {
  const trimmed = pattern.trim().replace(CONTROL_CHARS, '').slice(0, DOMAIN_PATTERN_MAX);

  if (trimmed.length === 0) {
    throw new Error('Pattern is required');
  }

  if (ruleType === 'IP') {
    return trimmed;
  }

  return trimmed.toLowerCase().replace(/\.$/, '');
}

export function matchesDomainRule(host: string, pattern: string): boolean {
  const normalizedHost = host.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  if (normalizedHost === normalizedPattern) {
    return true;
  }

  return normalizedHost.endsWith(`.${normalizedPattern}`);
}

export function matchesIpRule(
  hostOrIp: string,
  destinationIp: string | null | undefined,
  pattern: string,
): boolean {
  const normalizedPattern = pattern.trim();

  if (destinationIp && destinationIp === normalizedPattern) {
    return true;
  }

  return hostOrIp === normalizedPattern;
}

export function ruleMatchesContext(
  rule: FirewallRule,
  context: RuleMatchContext,
): boolean {
  if (!rule.enabled) {
    return false;
  }

  if (rule.ruleType === 'DOMAIN') {
    return matchesDomainRule(context.destinationHost, rule.pattern);
  }

  if (rule.ruleType === 'IP') {
    return matchesIpRule(
      context.destinationHost,
      context.destinationIp,
      rule.pattern,
    );
  }

  return false;
}

export function isBlockRule(rule: FirewallRule): boolean {
  return rule.action === FIREWALL_RULE_ACTIONS.BLOCK;
}

export function isAllowRule(rule: FirewallRule): boolean {
  return rule.action === FIREWALL_RULE_ACTIONS.ALLOW;
}

export function toRuleMatchResult(rule: FirewallRule): RuleMatchResult {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    ruleType: rule.ruleType,
    pattern: rule.pattern,
    action: rule.action as FirewallRuleAction,
  };
}
