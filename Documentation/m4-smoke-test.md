# GuardMe M4 — Vault, Re-auth & Analytics Smoke Test Checklist

End-to-end verification of the M4 feature set integrated with the real backend:
step-up re-authentication, the firewall **Rules** tab, the encrypted **Vault**
(full CRUD + lock), the **Analytics** page (RxJS `zip` / `forEach`), and SIEM
hygiene. Run manually after setup — there is no automated suite. Builds on the
M3 dashboard checklist (`m3-smoke-test.md`).

## 0. Setup

```powershell
# 1. PostgreSQL running with database `gateway_db`

# 2. Backend
cd apps/gateway-backend
copy .env.example .env   # set VIRUSTOTAL_API_KEY if testing threat scans
npm install
npm run prisma:migrate    # applies kdfSalt, VaultCredential, FirewallRule, traffic-log columns
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

Dashboard runs at `http://localhost:4200`. All dashboard modules call the real
HTTP API at `environment.apiBaseUrl` — there are **no mock APIs** (removed in M4).

## 1. Step-up re-authentication (M4.1)

The vault and other sensitive actions require a recent password verification
(`last_auth_at` within `reAuthTimeoutMinutes`, default 15).

- [ ] `POST /auth/verify-password` with the correct password returns success and
      updates `users.last_auth_at`
- [ ] A wrong password returns a generic failure and logs a `REAUTH_FAILURE`
      security event
- [ ] When the re-auth window is stale, the toolbar shows the "verify identity"
      prompt (polled every 30s in the shell)
- [ ] Triggering a guarded action opens the **Reauth dialog**; a correct password
      closes it and lets the action proceed
- [ ] Cancelling the dialog aborts the action without changing state

## 2. Firewall Rules tab (M4.2 / M4.2b)

- [ ] `/rules` shows **System rules** read-only (verdict → ALLOW / BLOCK / WARN,
      plus malicious-file block)
- [ ] **User rules** support full CRUD: create a BLOCK rule by domain, edit it,
      toggle enabled, delete it (`switchMap` per request, `takeUntil` on teardown)
- [ ] A user **BLOCK by domain** stops matching traffic before the threat scan
- [ ] A user **ALLOW by IP** lets matching traffic through
- [ ] Evaluation order holds: user BLOCK → user ALLOW → threat scan → system policy
- [ ] A rule match writes a `RULE_MATCH` security event (no raw `ruleId` shown in
      the Security UI — see §6)

## 3. Traffic table enrichment (M4.2b + M4.6)

- [ ] `/traffic` shows columns: time, method, **source IP**, URL, **dest IP**,
      decision, threat, risk, host
- [ ] Source IP renders as plain IPv4 (e.g. `127.0.0.1`, not `::1` /
      `::ffff:127.0.0.1`)
- [ ] **Destination IP** filter narrows the list (partial, case-insensitive match)
- [ ] Decision and threat-verdict filters reload the list (`switchMap`)
- [ ] All timestamps render in **24-hour** format (no AM/PM)

## 4. Vault — unlock / lock (M4.3 / M4.3b)

The vault key is derived (Argon2id KDF) from the password at unlock and cached
server-side; credentials are sealed with AES-256-GCM.

- [ ] `/vault` starts **locked**; entering the correct password unlocks it and
      loads credentials
- [ ] A wrong password shows an unlock error and logs `VAULT_UNLOCK_FAILURE`;
      a success logs `VAULT_UNLOCKED`
- [ ] **Lock** re-locks the vault and clears the credential list
- [ ] Unlock requires a valid re-auth window (§1)

## 5. Vault — credential CRUD + reveal (M4.3b / M4.6)

- [ ] **Create** a credential (service, username, password) → appears in the list
- [ ] **Edit** updates the row; **Delete** prompts for confirmation then removes it
- [ ] **View password** dialog opens masked (`****`); the eye icon toggles
      plaintext; **Copy password** always copies the real value
- [ ] Security check: the revealed password is **not** persisted in the NgRx store
      — confirm in Redux DevTools that `vault.revealedPasswords` does not exist and
      no action retains the plaintext after the dialog closes
- [ ] Locking the vault or logging out leaves no credential/secret state behind
      (store resets to `initialVaultState`)

## 6. Security events page (M4.6 hardening)

- [ ] `/security` lists events as expandable panels; type/severity filters work
- [ ] Expanded metadata **never** shows raw `userId` or `ruleId`; a human-readable
      `username` / rule name is shown when present, otherwise the field is hidden
- [ ] All other metadata fields and timestamps are intact, in **24-hour** format

## 7. SIEM hygiene (M4.2)

- [ ] No `THREAT_SCAN_COMPLETED` rows are written (`SELECT DISTINCT type FROM
      security_events;` should not contain it)
- [ ] Meaningful events still fire: `MALICIOUS_BLOCKED`, `AUTH_FAILURE`,
      `RULE_MATCH`, `VAULT_*`, `REAUTH_*`

## 8. Analytics page (M4.4 / M4.5)

`GET /siem/analytics/summary` aggregates, user-scoped, with optional
`from` / `to` / `bucketHours`.

- [ ] `/analytics` loads stat cards (total requests, security events, avg risk,
      high-risk count)
- [ ] **System status** card shows DB + VirusTotal from the RxJS **`zip`** result
      (analytics summary zipped with the current system-status snapshot) — there is
      no separate live fallback branch
- [ ] **Policy decisions** and **Threat verdicts** render as distribution bars
- [ ] **Security events by type / severity** populate from `forEach`-built series
- [ ] **Top destination hosts** table lists hosts + counts
- [ ] **Requests over time** shows bucketed bars; blocked share overlays each bar;
      bucket labels and the period header use 24-hour time
- [ ] Date-range filter reloads the summary; empty ranges show empty states

## 9. Regression — M3 still green

- [ ] Run the relevant M3 checks (auth, live feed, WebSocket resilience, logout,
      session expiry) — all still pass
- [ ] Logout disconnects the socket, clears traffic/security/status/vault slices,
      and proxy browsing returns `407` until re-auth
