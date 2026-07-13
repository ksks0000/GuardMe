# GuardMe Re-Authentication

Sensitive operations (password vault, firewall rule mutations) require the user to
have confirmed their password recently, even when a valid session cookie is present.
This limits damage from an unattended unlocked dashboard.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `REAUTH_TIMEOUT_MINUTES` | `15` | Window after login or verify-password during which sensitive routes are allowed |

Set in `apps/gateway-backend/.env` (see `.env.example`).

## How it works

1. **Login** (`POST /auth/login`) and **register-then-login** set `users.last_auth_at`.
2. **`POST /auth/verify-password`** (session required) re-confirms the password and
   refreshes `last_auth_at` without issuing a new JWT.
3. **`ReAuthGuard`** reads `last_auth_at` and rejects requests when the window has
   expired. The client should prompt for the password again (`ReauthDialog`).

```
Client                    API
  |-- POST /vault/... ----------------------->|  JwtSessionGuard OK
  |                                           |  ReAuthGuard: last_auth_at stale → 401
  |<-- 401 -----------------------------------|
  |-- POST /auth/verify-password (password) ->|
  |<-- 200 { lastAuthAt } --------------------|
  |-- POST /vault/... ----------------------->|  ReAuthGuard OK
```

## Endpoint: `POST /auth/verify-password`

- **Guards:** `JwtSessionGuard` (valid session cookie required)
- **Throttle:** same limit as `/auth/login` (brute-force protection)
- **Body:** `{ "password": "..." }` (8–128 chars)
- **Success (200):** `{ "message": "Password verified", "lastAuthAt": "<ISO8601>" }`
- **Failure (401):** generic `Invalid password` (no username/password distinction)
- **SIEM:** `REAUTH_FAILURE` on wrong password (includes client IP / user-agent metadata, never the password)

## Guard usage (backend)

Apply **both** guards on mutating sensitive routes:

```typescript
@Post('credentials')
@UseGuards(JwtSessionGuard, ReAuthGuard)
createCredential(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDto) {
  // ...
}
```

`ReAuthGuard` is provided globally via `CommonModule`. It must run **after**
`JwtSessionGuard` so `request.user` is populated.

Active consumers:

| Module | Routes |
|--------|--------|
| `rules` | `POST /rules`, `PATCH /rules/:id`, `DELETE /rules/:id` |
| `vault` | `POST /vault/credentials`, `PATCH`, `DELETE`, decrypt (`GET :id`) |
| `vault` | `POST /vault/unlock` (rate-limited; wrong password → `VAULT_UNLOCK_FAILURE`) |

Read-only list endpoints typically need only `JwtSessionGuard`.

## SIEM events

| Event | When |
|-------|------|
| `REAUTH_REQUIRED` | `ReAuthGuard` blocks a request (stale or missing `last_auth_at`) |
| `REAUTH_FAILURE` | Wrong password on `POST /auth/verify-password` |
| `VAULT_UNLOCKED` | Successful `POST /vault/unlock` |
| `VAULT_UNLOCK_FAILURE` | Wrong password on `POST /vault/unlock` |

Both are visible on the dashboard Security history page.

## Security notes

- Password verification uses Argon2id (`verifyPassword`); responses are generic on failure.
- Verify-password is rate-limited per IP like login/register.
- Re-auth refreshes `last_auth_at` only; it does **not** rotate the session JWT.
- Fingerprint checks still apply via the existing session on all authenticated routes.

## Dashboard

- **Stale indicator:** toolbar shows a “Re-auth needed” chip when `lastAuthAt` is older than `REAUTH_TIMEOUT_MINUTES` (frontend `environment.reAuthTimeoutMinutes`, default 15).
- **Reauth dialog:** opens automatically on API `401` with message “Re-authentication required”, or when the user clicks the chip.
- **`POST /auth/verify-password`** is called from the dialog; success updates `lastAuthAt` in the NgRx auth store without logging the user out.
- Wrong password on verify-password does **not** trigger session expiry (interceptor excludes that endpoint).
