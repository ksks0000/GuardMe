# Gathering results — evaluation checklist

## MVP criteria

| Criterion | How to show | Status |
|-----------|-------------|--------|
| Browser traffic routed through gateway | Proxy `localhost:8080` (or lab IP); request appears on Live / Traffic | ✅ |
| Malicious URLs blocked | Known-bad / VT-flagged HTTP URL → block page; SIEM `MALICIOUS_BLOCKED` | ✅ |
| Request logging | Traffic history lists method, host, policy, verdict, risk | ✅ |
| Vault encrypted at rest | Unlock vault → add credential → lock → DB stores ciphertext only | ✅ |
| Re-auth for sensitive ops | Wait past `REAUTH_TIMEOUT_MINUTES` → vault/rules mutation prompts verify-password | ✅ |
| Live dashboard activity | WebSocket feed updates while browsing through the proxy | ✅ |

## Phase 2 criteria

| Criterion | How to show | Status |
|-----------|-------------|--------|
| Behavioral baseline | Behavior tab → baseline heatmap + top hosts after ≥ `BASELINE_MIN_SAMPLE_SIZE` traffic in window | ✅ |
| UEBA anomaly scoring | Deviate from baseline (new host / off-hours / blocks) → `ANOMALY_DETECTED` + Behavior list | ✅ |
| Threat notifications | Bell badge + high/critical snackbar on block / anomaly / related events | ✅ |
| Event-driven modules | Proxy → SIEM → UEBA via domain events (`traffic.log.created`, `ueba.anomaly.detected`) | ✅ |
| Password generator | Vault add/edit → Generate fills password client-side only | ✅ |
| Advanced analytics | Analytics (traffic/security) + Behavior (timeline, risk, anomalies) | ✅ |

