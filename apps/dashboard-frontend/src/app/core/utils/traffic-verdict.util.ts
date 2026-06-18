import { POLICY_DECISIONS, PolicyDecision, THREAT_VERDICTS, ThreatVerdict } from '../models';

const THREAT_VERDICT_VALUES = new Set<string>(Object.values(THREAT_VERDICTS));

export function normalizeThreatVerdict(value: string): ThreatVerdict {
  const upper = value.toUpperCase();
  return THREAT_VERDICT_VALUES.has(upper)
    ? (upper as ThreatVerdict)
    : THREAT_VERDICTS.UNVERIFIED;
}

export function threatVerdictCssClass(value: string): string {
  return normalizeThreatVerdict(value).toLowerCase();
}

export function isBlockedPolicyDecision(decision: string): boolean {
  return decision === POLICY_DECISIONS.BLOCK;
}

export function isAllowedPolicyDecision(decision: string): boolean {
  return decision === POLICY_DECISIONS.ALLOW;
}

export function normalizePolicyDecision(value: string): PolicyDecision {
  const upper = value.toUpperCase();
  if (upper === POLICY_DECISIONS.BLOCK || upper === POLICY_DECISIONS.WARN || upper === POLICY_DECISIONS.ALLOW) {
    return upper as PolicyDecision;
  }

  return POLICY_DECISIONS.ALLOW;
}

export function policyDecisionCssClass(decision: string): string {
  switch (normalizePolicyDecision(decision)) {
    case POLICY_DECISIONS.BLOCK:
      return 'malicious';
    case POLICY_DECISIONS.WARN:
      return 'suspicious';
    case POLICY_DECISIONS.ALLOW:
    default:
      return 'safe';
  }
}
