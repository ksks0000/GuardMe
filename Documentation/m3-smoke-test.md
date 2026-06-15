# GuardMe M3 — Dashboard Smoke Test Checklist

End-to-end verification of the M3 Angular dashboard integrated with the real backend
(auth, SIEM history REST, live WebSocket). Run manually after setup — there is no
automated suite. Builds on the M2 gateway checklist (`m2-smoke-test.md`).

## 0. Setup

```powershell
# 1. PostgreSQL running (Docker or native install) with database `gateway_db`

# 2. Backend
cd apps/gateway-backend
copy .env.example .env   # set VIRUSTOTAL_API_KEY if testing threat scans
npm install
npm run prisma:migrate
npm run start:dev

# 3. Frontend (separate terminal)
cd apps/dashboard-frontend
npm install
npm start
```

**Expected backend log:**

```
GuardMe API listening on port 3000
GuardMe proxy listening on port 8080
WebSocket gateway ready on namespace /events
```

Dashboard runs at `http://localhost:4200`. Integration flags live in
`src/environments/environment.ts` (`useRealAuth`, `useRealSiem`, `useRealRealtime`).

## 1. Auth — register

Open `http://localhost:4200`, go to **Register**.

- [ ] Username < 3 or > 50 chars is rejected client-side
- [ ] Password < 8 chars is rejected client-side
- [ ] Mismatched password confirmation is rejected
- [ ] Successful register auto-logs-in and redirects to `/dashboard`
- [ ] A `users` row exists (`SELECT username FROM users;`)

## 2. Auth — login / session restore

- [ ] Log out, then log in with the same credentials
- [ ] Invalid credentials show a generic error (no username/password distinction)
- [ ] After login, refreshing the page keeps you authenticated (session restored via `/auth/me`)
- [ ] Visiting `/dashboard` while logged out redirects to `/login?returnUrl=…`
- [ ] After login you land back on the originally requested page

## 3. Route guards

- [ ] Logged out: `/dashboard`, `/traffic`, `/security` all redirect to login
- [ ] Logged in: visiting `/login` redirects to `/dashboard` (guest guard)

## 4. Proxy browsing → live dashboard

Configure browser proxy `localhost:8080` (bypass `localhost, 127.0.0.1`) — see
`infrastructure/proxy-config/browser-proxy.md`. Stay logged in on the dashboard.

- [ ] First proxied request prompts for proxy credentials (HTTP Basic)
- [ ] Entering the same GuardMe username/password authorizes browsing
- [ ] Visit `http://example.com` → page loads
- [ ] Dashboard **live feed** shows the request within ~1s (WebSocket)
- [ ] **Allowed** stat card increments; verdict distribution updates
- [ ] Each feed row shows a colour-coded verdict (SAFE green, etc.)

## 5. Verdict accuracy

- [ ] Safe HTTP URL → verdict `SAFE`, counted under Allowed
- [ ] Malicious test URL (`http://malware.testing.google.test/testing/malware/`) →
      verdict `MALICIOUS`, counted under Blocked, GuardMe block page shown
- [ ] VirusTotal unavailable → verdict `UNVERIFIED`, still counted under Allowed

## 6. Traffic history page

- [ ] `/traffic` lists logs paginated (15/page), newest first
- [ ] Page stats and the paginator share one row
- [ ] Verdict column colours match the dashboard
- [ ] Filter by verdict reloads the list (`switchMap`)
- [ ] URL search filters by host/URL fragment
- [ ] Date pickers + 24h time inputs filter by range
- [ ] Clear resets filters and results
- [ ] Empty result shows the empty-state component

## 7. Security events page

- [ ] `/security` lists security events as expandable panels (multiple can stay open)
- [ ] Type and severity filters work
- [ ] Expanding a panel shows metadata
- [ ] Generate a `SUSPICIOUS_PROCEED` (proceed past a warning) and confirm it appears
- [ ] A failed proxy login (wrong proxy password) creates an `AUTH_FAILURE` event

## 8. WebSocket resilience

- [ ] Stop the backend while logged in → live feed stops updating, no console crash
- [ ] Restart the backend → socket reconnects automatically (events resume) without re-login
- [ ] System status badge (DB / VirusTotal) reflects current health

## 9. Logout

- [ ] Sign out clears the username from the toolbar and returns to `/login`
- [ ] `sessions.revoked_at` is set for the session
- [ ] Live feed disconnects; store slices (traffic/security/status) are cleared
- [ ] Proxy browsing now returns `407` until re-auth

## 10. Session expiry

- [ ] With the app open, revoke the session in the DB
      (`UPDATE sessions SET revoked_at = now() WHERE revoked_at IS NULL;`)
- [ ] The next API call returns 401 and redirects to login with a
      "session expired" message
