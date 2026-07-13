# GuardMe Browser Proxy Setup

GuardMe runs two HTTP listeners:

| Port | Service |
|------|---------|
| `3000` | Management API (`/auth/*`, `/siem/*`, WebSocket `/events`) |
| `8080` | Forward proxy (browser traffic) |

## Prerequisites

1. PostgreSQL running (Docker or native install)
2. `npm run prisma:migrate` in `apps/gateway-backend`
3. `npm run start:dev` in `apps/gateway-backend`
4. Dashboard at `http://localhost:4200` (`npm start` in `apps/dashboard-frontend`)

## Configure browser proxy

### Local single-machine setup

- **HTTP proxy:** `localhost`
- **Port:** `8080`
- **Use for all protocols** (HTTP and HTTPS)
- **No proxy for:** `localhost, 127.0.0.1`

Use `localhost` (not `127.0.0.1`) so dashboard cookies and API calls stay consistent.

### Two-VM VMware lab

When the dashboard and proxy run on the **Gateway VM** and you browse from the **User VM**, point the browser at the gateway IP.

| Setting | Example value |
|---------|----------------|
| HTTP proxy host | `192.168.56.10` |
| Port | `8080` |
| Also use for HTTPS | Yes |
| No proxy for | `192.168.56.10, localhost, 127.0.0.1` |

Open the dashboard at `http://192.168.56.10:4200` (not `localhost` on the User VM).

### Firefox

1. Settings → Network Settings → Manual proxy configuration
2. HTTP Proxy: `localhost`, Port `8080`
3. Enable “Also use this proxy for HTTPS”
4. **No proxy for:** `localhost, 127.0.0.1`

### Chrome / Edge (Windows system proxy)

1. Settings → Network → Proxy → Manual
2. Address `localhost`, Port `8080`
3. **Bypass:** `localhost;127.0.0.1`

## How authentication works (dashboard + browser)

Browsers **do not** send the dashboard login cookie on proxied requests to sites like `example.com`. GuardMe uses standard **HTTP proxy authentication** instead:

1. **Sign in** on the dashboard (`http://localhost:4200`) — powers the live feed and history UI.
2. In **another tab**, open an HTTP site (e.g. `http://example.com`).
3. The browser shows a **proxy login** dialog (after `407 Proxy Authentication Required`).
4. Enter the **same username and password** as the dashboard (e.g. `test1` / your password).
5. Firefox/Chrome **remember** proxy credentials for the session — you usually only enter them once.

The live dashboard WebSocket uses your dashboard session cookie; proxied browsing uses `Proxy-Authorization: Basic`. Both tie traffic to your user account.

## Expected behavior

| Scenario | Result |
|----------|--------|
| Not logged in (no proxy credentials) | `407` + browser auth prompt |
| Valid proxy credentials | Traffic forwarded and logged |
| Safe HTTP URL | Forwarded to internet |
| Malicious URL (VT) | GuardMe block page |
| Suspicious URL (VT) | Warning interstitial → Proceed link |
| VT unavailable | Allowed as `UNVERIFIED`, logged to SIEM |
| HTTPS (`CONNECT`) | Hostname reputation check |

## Test URLs

Start with **HTTP** (full URL inspection):

- `http://example.com`
- `http://neverssl.com`

Then HTTPS:

- `https://example.com`

## HTTPS note

Without TLS interception, HTTPS tunnels only expose `host:port` to the gateway. VirusTotal scans the hostname. Warning interstitials apply to **HTTP** requests with full URLs.
