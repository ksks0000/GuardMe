# GuardMe — Security Event Types Testing Guide

Manual checklist for verifying all security event types appear on the
dashboard **Security** page (`/security`) for the **currently logged-in user**.

Events are scoped by the `user_id` column. The live feed and
history API only show events for user account. 

## 0. Setup

```powershell
# Backend
cd apps/gateway-backend
# Ensure .env has DATABASE_URL, JWT_SECRET, etc.
npm run start:dev

# Frontend (separate terminal)
cd apps/dashboard-frontend
npm start
```

- Dashboard: `http://localhost:4200`
- API: `http://localhost:3000`
- Proxy: `localhost:8080` (browser proxy; bypass `localhost`)

**Verify in the UI:** open `/security`, use the **Event type** filter, refresh
after each step. Expand a row to inspect metadata.

## Event types reference

All **15** types defined in `siem.config.ts`:

| # | Type | Severity | Key metadata |
|---|------|----------|--------------|
| 1 | `AUTH_FAILURE` | MEDIUM | `source`, `reason`, `attemptedUsername` |
| 2 | `VAULT_UNLOCKED` | LOW | `userId`, `username` |
| 3 | `VAULT_UNLOCK_FAILURE` | MEDIUM | `userId`, `username` |
| 4 | `VAULT_DECRYPT_FAILURE` | HIGH | `credentialId` |
| 5 | `REAUTH_REQUIRED` | LOW | `userId`, `username` |
| 6 | `REAUTH_FAILURE` | MEDIUM | `userId`, `username` |
| 7 | `RULE_MATCH` | MEDIUM | `url`, `ruleId`, `action` |
| 8 | `MALICIOUS_BLOCKED` | HIGH | `url`, `riskScore` |
| 9 | `SUSPICIOUS_PROCEED` | HIGH | `url`, `sessionId` |
| 10 | `THREAT_SCAN_FAILURE` | CRITICAL | `url`, `reason`, `failStrategy` |
| 11 | `THREAT_SCAN_TIMEOUT` | CRITICAL | `url`, `reason` |
| 12 | `FINGERPRINT_MISMATCH` | HIGH | `expectedIp`, `actualIp` |
| 13 | `SESSION_REVOKED` | MEDIUM | `sessionId`, `jwtId` |
| 14 | `PROXY_ERROR` | CRITICAL | `path`, `error` |

## 1. `AUTH_FAILURE` — Authentication failed

Same event type for dashboard login and proxy auth; different
`metadata.source` (`dashboard` vs omitted on proxy) and message text.

### 1a. Dashboard login failed

**Trigger:** Wrong credentials on the **Sign in** page (`/login`).

1. Sign out if already logged in.
2. Go to `/login`.
3. Enter your **username** with a **wrong password**.
4. Submit the form.
5. Sign in with the **correct** password so you can open `/security`.

**Expect:**

- Login form error (generic “Invalid username or password”).
- MEDIUM severity, message **“Dashboard login failed”**.
- Metadata: `source: "dashboard"`, `reason: "invalid_password"`,
  `attemptedUsername`, `clientIp`, `userAgent`.
- Event visible on Security **after** you log in successfully (scoped to your
  `user_id`).

### 1b. Proxy authentication failed

**Trigger:** Wrong proxy credentials when the browser prompts for proxy auth.

1. Sign in to the dashboard.
2. Configure browser proxy to `localhost:8080`.
3. Browse any HTTP URL (e.g. `http://example.com`).
4. When prompted, enter your **username** with a **wrong password**.

**Expect:** MEDIUM severity, message **“Proxy authentication failed”**,
metadata `attemptedUsername`, `reason` (`invalid_password` or `unknown_user`),
`clientIp`, `userAgent`. Visible on Security while logged in as that user.

---

## 2. `VAULT_UNLOCKED` — Vault unlocked

**Trigger:** Correct account password on the Vault unlock form.

1. Go to **Vault** (`/vault`).
2. Enter your **correct** account password and click **Unlock vault**.

**Expect:** LOW severity, message “Vault unlocked”.

---

## 3. `VAULT_UNLOCK_FAILURE` — Vault unlock failed

**Trigger:** Wrong account password on the Vault unlock form.

1. Go to **Vault** while locked.
2. Enter a **wrong** password and click **Unlock vault**.

**Expect:**

- Red error banner on the Vault page: “Invalid password.”
- MEDIUM severity security event “Vault unlock failed”.
- You remain logged in (wrong password must not sign you out).

---

## 4. `VAULT_DECRYPT_FAILURE` — Vault credential decrypt failed

**Trigger:** Stored credential ciphertext is corrupt (GCM auth
failure). Not a normal user action — lab test only.

1. Unlock vault and **add a credential** (note its id from the list or network
   tab).
2. Lock the vault, then corrupt the row in PostgreSQL (replace `id`):

   ```sql
   UPDATE vault_credentials
   SET auth_tag = 'AAAAAAAAAAAAAAAAAAAAAA=='
   WHERE id = 'your-credential-uuid';
   ```

3. Unlock vault again, complete **re-auth** if prompted.
4. Open the credential detail (view password).

**Expect:**

- API returns a generic error (credential could not be decrypted).
- HIGH severity `VAULT_DECRYPT_FAILURE` on Security.
- Restore or delete the broken row after testing.

---

## 5. `REAUTH_REQUIRED` — Re-authentication required

**Trigger:** A **guarded API action** while the re-auth window is stale.

The toolbar re-auth chip / auto dialog alone does **not** log this event. You
must hit a backend route protected by `ReAuthGuard` **before** verifying your
password.

1. Set `REAUTH_TIMEOUT_MINUTES=1`, restart backend, sign in.
2. Wait until the toolbar shows **Re-auth needed** (~1 minute).
3. **Do not** complete the dialog yet.
4. Click **Add credential** on Vault (or create/edit/delete a **Rules** entry).

**Expect:** LOW severity, “Re-authentication required for sensitive action”.
The re-auth dialog should open.

---

## 6. `REAUTH_FAILURE` — Re-authentication failed

**Trigger:** Wrong password in the re-auth dialog.

1. Open the re-auth dialog (stale window or from step 5).
2. Enter a **wrong** password and submit.

**Expect:** MEDIUM severity, “Re-authentication failed”.

---

## 7. `RULE_MATCH` — User firewall rule matched

**Trigger:** Proxied traffic matches a user BLOCK or ALLOW rule.

1. Go to **Rules**, create a custom rule (e.g. domain `example.com`).
2. Through the proxy, visit `http://example.com`.

**Expect:** MEDIUM severity, message includes rule action (`BLOCK` or `ALLOW`).

---

## 8. `MALICIOUS_BLOCKED` — Malicious URL blocked

**Trigger:** VirusTotal flags URL as malicious.

1. Set a valid `VIRUSTOTAL_API_KEY` in `.env`.
2. Remove/disable user rules that would match the test URL.
3. Through the proxy, visit Google’s malware test URL:

   ```
   http://malware.testing.google.test/testing/malware/
   ```

**Expect:** HIGH severity, GuardMe block page in browser, event in Security.

---

## 9. `SUSPICIOUS_PROCEED` — User proceeded past warning

**Trigger:** Click “Proceed” on the warning interstitial.

1. Remove user rules matching the test URL.
2. Through the proxy, visit a URL that triggers **WARN** (easiest: file
   heuristic):

   ```
   http://example.com/download.zip
   ```

3. On the warning page, click **Proceed at your own risk**.

**Expect:** HIGH severity, “User proceeded past security warning”.

---

## 10. `THREAT_SCAN_FAILURE` — VirusTotal scan failed

**Trigger:** Threat scan fail-open (missing/invalid API key or API error).

1. Clear or invalidate `VIRUSTOTAL_API_KEY` in `.env`, restart backend.
2. Remove user rules matching the URL.
3. Through the proxy, browse plain HTTP, e.g. `http://neverssl.com`.

**Expect:**

- Traffic log: **ALLOW** / **UNVERIFIED** (fail-open policy; or **BLOCK** if
  `THREAT_FAIL_STRATEGY=closed`).
- **CRITICAL** severity `THREAT_SCAN_FAILURE` on Security.

**Note:** If the upstream forward times out, you may **also** see `PROXY_ERROR`
and an internal error page in the browser. That is separate from the threat scan
event.

---

## 11. `THREAT_SCAN_TIMEOUT` — VirusTotal scan timed out

**Trigger:** VirusTotal request exceeds the scan timeout.

1. Restore a **valid** `VIRUSTOTAL_API_KEY`.
2. Set aggressive timeout in `.env`:

   ```env
   THREAT_SCAN_TIMEOUT_MS=1
   ```

3. Restart backend, browse HTTP through proxy (no matching user rule).

**Expect:** **CRITICAL** severity `THREAT_SCAN_TIMEOUT`, traffic ALLOW /
UNVERIFIED (unless fail-closed).

Reset `THREAT_SCAN_TIMEOUT_MS` after testing (default `30000`).

---

## 12. `FINGERPRINT_MISMATCH` — Session fingerprint mismatch

**Trigger:** Same session cookie used with a **different User-Agent** (or IP).

### Option A — PowerShell (Windows)

```powershell
# After dashboard login, export cookies to cookies.txt (or use browser devtools)
curl.exe http://localhost:3000/auth/me -b cookies.txt -H "User-Agent: GuardMe-Test-Browser"
```

### Option B — Firefox: change User-Agent while staying logged in

1. Create a session with normal user agent, stay logged in on the dashboard.
2. Override User-Agent in Firefox:
   - Open a new tab → about:config → accept the warning
   - Search: general.useragent.override
   - New → String → GuardMe-Test-Browser/1.0
   - Go back to the dashboard tab
3. Trigger an API request

**Expect:** HIGH severity “Session device fingerprint mismatch”.

With default `SESSION_FINGERPRINT_STRICT=true`, you usually also get
`SESSION_REVOKED` (next step) and the session is invalidated.

To see **only** `FINGERPRINT_MISMATCH` without revoke, temporarily set
`SESSION_FINGERPRINT_STRICT=false`, restart backend, repeat.

---

## 13. `SESSION_REVOKED` — Session revoked

**Trigger:** Strict fingerprint mismatch (default).

Same steps as 12. with `SESSION_FINGERPRINT_STRICT=true` (default).

**Expect:** MEDIUM severity “Session revoked due to fingerprint mismatch”.
Dashboard session may end on the next API call.

---

## 14. `PROXY_ERROR` — Internal proxy error

**Trigger:** Unhandled error in the HTTP proxy pipeline (often upstream forward failure).

Examples:

- Browse a URL whose forward times out (e.g. `http://neverssl.com` with network issues).
- Visit a hostname that causes an internal proxy failure.

**Expect:** **CRITICAL** severity “Internal proxy error”, metadata includes
`path` and `error`. Traffic may already be logged as ALLOW before forward
fails.
