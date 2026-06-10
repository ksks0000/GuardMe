# GuardMe M2 — Manual Smoke Test Checklist

End-to-end verification of the M2 gateway core (SIEM, VirusTotal, policy engine, forward proxy, WebSocket events). No automated test suite — run these checks manually after setup.

## 0. Setup

```powershell
# 1. Start PostgreSQL
cd infrastructure/docker
docker compose --profile dev up -d

# 2. Apply migrations
cd ../../apps/gateway-backend
npx prisma migrate deploy

# 3. Configure .env (copy from .env.example, set VIRUSTOTAL_API_KEY)

# 4. Start the gateway
npm run start:dev
```

**Expected log output:**

```
GuardMe API listening on port 3000
GuardMe proxy listening on port 8080
WebSocket gateway ready on namespace /events
```

## 1. Health endpoint

```powershell
curl http://localhost:3000/health
```

- [ ] Returns `{ "db": "ok", "virusTotal": "ok", "timestamp": "..." }`
- [ ] Stop Postgres → `db` becomes `degraded` (after ~30s cache expiry)
- [ ] Remove `VIRUSTOTAL_API_KEY` + restart → `virusTotal: "degraded"`

## 2. Auth (M1 regression)

```powershell
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"username":"demo","password":"Str0ngPass!"}'
curl -X POST http://localhost:3000/auth/login -c cookies.txt -H "Content-Type: application/json" -d '{"username":"demo","password":"Str0ngPass!"}'
curl http://localhost:3000/auth/me -b cookies.txt
```

- [ ] Register returns the public profile
- [ ] Login sets the HttpOnly cookie
- [ ] `/auth/me` returns the profile with `fingerprintMatched: true`

## 3. Proxy requires authentication

```powershell
# Without cookie:
curl -x http://127.0.0.1:8080 http://example.com -v
```

- [ ] Returns `407 Proxy Authentication Required` with GuardMe HTML page

## 4. Safe URL is forwarded

Configure the browser proxy to `127.0.0.1:8080` (see `infrastructure/proxy-config/browser-proxy.md`), log in at `http://localhost:3000`, then visit `http://example.com`.

Or with curl (cookie from step 2):

```powershell
curl -x http://127.0.0.1:8080 http://example.com -b cookies.txt
```

- [ ] Page content is returned
- [ ] New row in `traffic_logs` with `verdict = 'ALLOW'`, client IP, destination host/port

```sql
SELECT method, url, destination_host, destination_port, verdict, risk_score, client_ip
FROM traffic_logs ORDER BY timestamp DESC LIMIT 5;
```

## 5. Malicious URL is blocked

```powershell
curl -x http://127.0.0.1:8080 "http://malware.testing.google.test/testing/malware/" -b cookies.txt
```

- [ ] GuardMe **block page** (HTTP 403), request NOT forwarded
- [ ] `traffic_logs` row with `verdict = 'BLOCK'`, risk score 90

## 6. Warning interstitial + proceed (HTTP)

Visit a URL VirusTotal marks SUSPICIOUS (or a download like `http://host/file.zip` to trigger the file heuristic WARN).

- [ ] Warning page with threat summary and "Proceed at your own risk" link
- [ ] Clicking proceed forwards the request exactly once
- [ ] `security_events` row with type `SUSPICIOUS_PROCEED`
- [ ] Re-using the same proceed link → warning page again (token is one-time)

## 7. File download heuristic

```powershell
curl -x http://127.0.0.1:8080 "http://example.com/setup.exe" -b cookies.txt
```

- [ ] Blocked (high-risk extension), even if the URL itself is SAFE

## 8. VirusTotal fail-safe

Set an invalid `VIRUSTOTAL_API_KEY` (or disconnect network), restart, browse any HTTP URL.

- [ ] Request is **allowed** as UNVERIFIED (fail-open by design)
- [ ] `security_events` row with type `THREAT_SCAN_FAILURE` (or `THREAT_SCAN_TIMEOUT`)

## 9. HTTPS CONNECT tunnel

With the browser proxy configured for HTTPS too, visit `https://www.google.com`.

- [ ] Page loads (hostname scanned, tunnel established)
- [ ] `traffic_logs` row with `method = 'CONNECT'`, port 443
- [ ] Suspicious/malicious HTTPS hosts are rejected (403 on CONNECT)

## 10. WebSocket live events

Log in in a browser at `http://localhost:3000`, then in DevTools console (Socket.IO client loaded):

```javascript
const socket = io('http://localhost:3000/events', { withCredentials: true });
socket.on('connect', () => console.log('WS connected'));
socket.on('SYSTEM_STATUS', (d) => console.log('SYSTEM_STATUS', d));
socket.on('TRAFFIC_LOG', (d) => console.log('TRAFFIC_LOG', d));
socket.on('SECURITY_EVENT', (d) => console.log('SECURITY_EVENT', d));
socket.on('SESSION_EVENT', (d) => console.log('SESSION_EVENT', d));
```

- [ ] `SYSTEM_STATUS` arrives immediately after connect
- [ ] Browsing through the proxy produces live `TRAFFIC_LOG` events
- [ ] Security events (e.g. VT failure, suspicious proceed) appear as `SECURITY_EVENT`
- [ ] Without a session cookie the socket is disconnected immediately

## 11. security_events coverage

```sql
SELECT type, severity, message, created_at FROM security_events ORDER BY created_at DESC LIMIT 20;
```

Confirm these types appear after the steps above:

- [ ] `FINGERPRINT_MISMATCH` (call `/auth/me` with a different User-Agent)
- [ ] `THREAT_SCAN_FAILURE` / `THREAT_SCAN_TIMEOUT` (step 8)
- [ ] `THREAT_SCAN_COMPLETED` (any successful scan)
- [ ] `SUSPICIOUS_PROCEED` (step 6)
- [ ] `PROXY_ERROR` (e.g. visit `http://nonexistent-domain-abc123.test`)

## 12. Logout revokes proxy access

```powershell
curl -X POST http://localhost:3000/auth/logout -b cookies.txt
curl -x http://127.0.0.1:8080 http://example.com -b cookies.txt
```

- [ ] Logout succeeds; `sessions.revoked_at` is set
- [ ] Subsequent proxy request returns `407` (session revoked)
