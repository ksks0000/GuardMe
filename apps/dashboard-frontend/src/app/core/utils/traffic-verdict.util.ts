import { THREAT_VERDICTS, ThreatVerdict } from '../models';

/** Legacy proxy pipeline stored policy decisions in the verdict column. */
const POLICY_DECISION_VERDICT: Record<string, ThreatVerdict> = {
  ALLOW: THREAT_VERDICTS.SAFE,
  WARN: THREAT_VERDICTS.SUSPICIOUS,
  BLOCK: THREAT_VERDICTS.MALICIOUS,
};

const THREAT_VERDICT_VALUES = new Set<string>(Object.values(THREAT_VERDICTS));

export function normalizeTrafficVerdict(verdict: string): ThreatVerdict {
  const upper = verdict.toUpperCase();

  if (THREAT_VERDICT_VALUES.has(upper)) {
    return upper as ThreatVerdict;
  }

  return POLICY_DECISION_VERDICT[upper] ?? THREAT_VERDICTS.UNVERIFIED;
}

/** CSS modifier suffix for `.verdict--{suffix}` (safe, suspicious, malicious, unverified). */
export function trafficVerdictCssClass(verdict: string): string {
  return normalizeTrafficVerdict(verdict).toLowerCase();
}

export function isBlockedTrafficVerdict(verdict: string): boolean {
  return normalizeTrafficVerdict(verdict) === THREAT_VERDICTS.MALICIOUS;
}

export function isAllowedTrafficVerdict(verdict: string): boolean {
  const normalized = normalizeTrafficVerdict(verdict);
  return (
    normalized === THREAT_VERDICTS.SAFE || normalized === THREAT_VERDICTS.UNVERIFIED
  );
}
