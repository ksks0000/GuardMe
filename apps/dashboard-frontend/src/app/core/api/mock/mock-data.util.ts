import {
  SecurityEvent,
  SIEM_EVENT_SEVERITIES,
  SIEM_EVENT_TYPES,
  SystemStatus,
  THREAT_VERDICTS,
  ThreatVerdict,
  TrafficLog,
} from '../../models';

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_CLIENT_IP = '192.168.1.42';

const SAMPLE_HOSTS = [
  'example.com',
  'github.com',
  'stackoverflow.com',
  'news.ycombinator.com',
  'malware.wicar.org',
  'phishing-test.example',
  'wikipedia.org',
  'npmjs.com',
];

const SAMPLE_PATHS = ['', '/search', '/login', '/api/v1/status', '/download/file.zip', '/about'];

const VERDICT_WEIGHTS: ThreatVerdict[] = [
  THREAT_VERDICTS.SAFE,
  THREAT_VERDICTS.SAFE,
  THREAT_VERDICTS.SAFE,
  THREAT_VERDICTS.SAFE,
  THREAT_VERDICTS.SUSPICIOUS,
  THREAT_VERDICTS.MALICIOUS,
  THREAT_VERDICTS.UNVERIFIED,
];

const METHODS = ['GET', 'GET', 'GET', 'POST', 'CONNECT'];

function riskScoreForVerdict(verdict: ThreatVerdict): number {
  switch (verdict) {
    case THREAT_VERDICTS.SAFE:
      return 5 + Math.floor(Math.random() * 15);
    case THREAT_VERDICTS.SUSPICIOUS:
      return 40 + Math.floor(Math.random() * 25);
    case THREAT_VERDICTS.MALICIOUS:
      return 75 + Math.floor(Math.random() * 25);
    default:
      return 50 + Math.floor(Math.random() * 20);
  }
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function uuid(): string {
  return crypto.randomUUID();
}

export function createTrafficLog(overrides: Partial<TrafficLog> = {}): TrafficLog {
  const host = randomItem(SAMPLE_HOSTS);
  const path = randomItem(SAMPLE_PATHS);
  const verdict = randomItem(VERDICT_WEIGHTS);
  const url = `http://${host}${path}`;

  return {
    id: uuid(),
    userId: MOCK_USER_ID,
    clientIp: MOCK_CLIENT_IP,
    url,
    destinationHost: host,
    destinationPort: host.includes('malware') ? 8080 : 80,
    method: randomItem(METHODS),
    verdict,
    riskScore: riskScoreForVerdict(verdict),
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

const SECURITY_EVENT_TEMPLATES: Array<{
  type: string;
  severity: string;
  message: string;
  metadata?: Record<string, unknown>;
}> = [
  {
    type: SIEM_EVENT_TYPES.THREAT_SCAN_COMPLETED,
    severity: SIEM_EVENT_SEVERITIES.LOW,
    message: 'VirusTotal scan completed for http://example.com',
    metadata: { url: 'http://example.com', verdict: THREAT_VERDICTS.SAFE },
  },
  {
    type: SIEM_EVENT_TYPES.SUSPICIOUS_PROCEED,
    severity: SIEM_EVENT_SEVERITIES.HIGH,
    message: 'User proceeded to suspicious URL after warning',
    metadata: { url: 'http://phishing-test.example/login' },
  },
  {
    type: SIEM_EVENT_TYPES.THREAT_SCAN_FAILURE,
    severity: SIEM_EVENT_SEVERITIES.MEDIUM,
    message: 'VirusTotal API returned an error; URL marked UNVERIFIED',
    metadata: { url: 'http://unknown-site.test' },
  },
  {
    type: SIEM_EVENT_TYPES.AUTH_FAILURE,
    severity: SIEM_EVENT_SEVERITIES.MEDIUM,
    message: 'Failed login attempt from 192.168.1.99',
  },
  {
    type: SIEM_EVENT_TYPES.PROXY_ERROR,
    severity: SIEM_EVENT_SEVERITIES.HIGH,
    message: 'Upstream connection reset while forwarding request',
    metadata: { host: 'timeout.example.com' },
  },
  {
    type: SIEM_EVENT_TYPES.FINGERPRINT_MISMATCH,
    severity: SIEM_EVENT_SEVERITIES.HIGH,
    message: 'Session fingerprint mismatch detected',
  },
];

export function createSecurityEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  const template = randomItem(SECURITY_EVENT_TEMPLATES);

  return {
    id: uuid(),
    type: template.type,
    severity: template.severity,
    message: template.message,
    metadata: template.metadata,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createSystemStatus(overrides: Partial<SystemStatus> = {}): SystemStatus {
  const degraded = Math.random() < 0.08;

  return {
    db: degraded && Math.random() < 0.5 ? 'degraded' : 'ok',
    virusTotal: degraded ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function seedTrafficLogs(count: number): TrafficLog[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, index) => {
    const minutesAgo = index * 3 + Math.floor(Math.random() * 2);
    return createTrafficLog({
      timestamp: new Date(now - minutesAgo * 60_000).toISOString(),
    });
  });
}

export function seedSecurityEvents(count: number): SecurityEvent[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, index) => {
    const minutesAgo = index * 12 + Math.floor(Math.random() * 5);
    return createSecurityEvent({
      createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
    });
  });
}
