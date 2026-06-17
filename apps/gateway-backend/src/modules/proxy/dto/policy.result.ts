import { ThreatVerdict } from '../../threat/dto/threat-verdict.enum';
import { PolicyDecision } from './policy-decision.enum';

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
  riskScore: number;
  threatVerdict: ThreatVerdict;
  matchedRuleId?: string | null;
  metadata?: Record<string, unknown>;
}
