import { SystemPolicyRule } from '../../models';

/** Mirrors backend policy.config systemRules (read-only in UI). */
export const MOCK_SYSTEM_RULES: SystemPolicyRule[] = [
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
];
