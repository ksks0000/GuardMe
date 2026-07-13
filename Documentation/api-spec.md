# GuardMe API specification

Base URL (local): `http://localhost:3000`  
Proxy (separate listener): `http://localhost:8080`  
WebSocket namespace: `/events` (Socket.IO)

Management routes require an authenticated session cookie (`COOKIE_NAME`, default `gateway_access_token`) via `JwtSessionGuard`.  
CORS allowlist: `API_CORS_ORIGINS` / `WS_CORS_ORIGINS` (credentials enabled).

---

## Auth — `/auth`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/auth/register` | No | Create user; throttled |
| `POST` | `/auth/login` | No | Sets HttpOnly session cookie; throttled |
| `POST` | `/auth/logout` | Session | Clears cookie |
| `GET` | `/auth/me` | Session | Current profile + `lastAuthAt` |
| `POST` | `/auth/verify-password` | Session | Refreshes `lastAuthAt` for re-auth window; throttled |

## Health — `/health`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/health` | No | Liveness / dependency snapshot for demos |

## SIEM — `/siem`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/siem/traffic-logs` | Session | Paginated traffic history (`from`, `to`, filters, page) |
| `GET` | `/siem/security-events` | Session | Paginated security events |
| `GET` | `/siem/analytics/summary` | Session | Aggregates for Analytics tab |

## UEBA — `/ueba`

Dashboard feature name: **Behavior**. Backend prefix remains `/ueba`.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/ueba/baseline` | Session | Current baseline. If none stored and traffic ≥ min samples, **lazily computes** and persists one. Otherwise returns `insufficient_data` with live sample count. |
| `POST` | `/ueba/baseline/refresh` | Session | Force recompute (expensive). **Throttled** like auth routes. Not exposed in the dashboard UI. |
| `GET` | `/ueba/anomalies` | Session | Paginated `ANOMALY_DETECTED` items + timeline + risk trend (`from`, `to`, `page`, `pageSize`) |

### Baseline payload (summary)

```json
{
  "status": "ready | insufficient_data",
  "sampleSize": 120,
  "minSampleSize": 50,
  "windowDays": 7,
  "updatedAt": "ISO-8601 | null",
  "snapshot": { "activeHours": [], "topHosts": [], "riskScore": {} }
}
```

## Vault — `/vault`

Mutating / decrypt routes also require `ReAuthGuard` (fresh `lastAuthAt`).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/vault/status` | Session | Locked / unlocked |
| `POST` | `/vault/unlock` | Session + re-auth window rules | Derive vault key; wrong password → SIEM |
| `POST` | `/vault/lock` | Session | Clear in-memory vault key |
| `GET` | `/vault/credentials` | Session | Metadata list (no plaintext) |
| `GET` | `/vault/credentials/:id` | Session + re-auth | Decrypt one credential |
| `POST` | `/vault/credentials` | Session + re-auth | Create |
| `PATCH` | `/vault/credentials/:id` | Session + re-auth | Update |
| `DELETE` | `/vault/credentials/:id` | Session + re-auth | Delete |

## Firewall rules — `/rules`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/rules` | Session | List |
| `POST` | `/rules` | Session + re-auth | Create |
| `PATCH` | `/rules/:id` | Session + re-auth | Update |
| `DELETE` | `/rules/:id` | Session + re-auth | Delete |

## Forward proxy — `:8080`

Not part of the REST API surface. Browser configures HTTP(S) proxy here.

- Auth: HTTP `Proxy-Authorization: Basic` (same username/password as dashboard account)
- Decisions: ALLOW / BLOCK with VirusTotal-backed verdicts where applicable
- Each handled request persists a traffic log and may emit domain / SIEM / notification events

---

## WebSocket — `/events`

Connect with session cookie (same-origin / allowlisted CORS + credentials).

| Event | Direction | Purpose |
|-------|-----------|---------|
| `TRAFFIC_LOG` | Server → client | Live traffic row |
| `SECURITY_EVENT` | Server → client | New security event |
| `SYSTEM_STATUS` | Server → client | Periodic gateway status |
| `SESSION_EVENT` | Server → client | Session lifecycle signals |
| `THREAT_NOTIFICATION` | Server → client | User-visible threat alert (bell + toast for high/critical) |

---

## Internal domain events (Nest EventEmitter)

Not exposed on the wire.

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `traffic.log.created` | SIEM | UEBA listener |
| `security.event.created` | SIEM | WebSocket gateway |
| `ueba.anomaly.detected` | UEBA | Notification service |

---

## Notable environment variables (UEBA)

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASELINE_WINDOW_DAYS` | `7` | Rolling window for baseline samples |
| `BASELINE_MIN_SAMPLE_SIZE` | `50` | Minimum traffic rows before baseline is ready |
| `UEBA_ALERT_THRESHOLD` | `60` | Min anomaly score (0–100) to persist `ANOMALY_DETECTED` |
| `UEBA_ALERT_COOLDOWN_MS` | `120000` | Per-user alert cooldown |
| `UEBA_VOLUME_SPIKE_MULTIPLIER` | `3` | Volume-spike signal sensitivity |
