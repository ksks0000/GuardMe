# GuardMe Browser Proxy Setup

GuardMe runs two HTTP listeners:

| Port | Service |
|------|---------|
| `3000` | Management API (`/auth/*`, future dashboard) |
| `8080` | Forward proxy (browser traffic) |

## Prerequisites

1. PostgreSQL running (`docker compose up -d` in `infrastructure/docker`)
2. `npx prisma migrate deploy` in `apps/gateway-backend`
3. `npm run start:dev` in `apps/gateway-backend`
4. Register and log in via `POST http://localhost:3000/auth/login` (sets HttpOnly session cookie)

## Configure browser proxy

### Local single-machine setup

- **HTTP proxy:** `127.0.0.1`
- **Port:** `8080`
- **Use for all protocols** (HTTP and HTTPS)

### VMware lab (two VMs)

- **HTTP proxy:** `<gateway-vm-ip>` (e.g. `192.168.x.x`)
- **Port:** `8080`

### Firefox

1. Settings → Network Settings → Manual proxy configuration
2. HTTP Proxy: `127.0.0.1`, Port `8080`
3. Enable “Also use this proxy for HTTPS”
4. No proxy for: `localhost, 127.0.0.1`

### Chrome / Edge (Windows)

Uses system proxy:

1. Settings → Network → Proxy → Manual
2. Address `127.0.0.1`, Port `8080`

Or launch with:

```text
--proxy-server="127.0.0.1:8080"
```

## Expected behavior

| Scenario | Result |
|----------|--------|
| Not logged in | `407 Proxy Authentication Required` |
| Safe HTTP URL | Forwarded to internet |
| Malicious URL (VT) | GuardMe block page |
| Suspicious URL (VT) | Warning interstitial → Proceed link (one-time bypass) |
| VT unavailable | Allowed as `UNVERIFIED`, logged to SIEM |
| HTTPS (`CONNECT`) | Hostname reputation check; no full URL path without TLS MITM |

## HTTPS note

Without TLS interception, HTTPS tunnels only expose `host:port` to the gateway. VirusTotal scans the hostname. Warning interstitials apply to **HTTP** requests with full URLs. Suspicious HTTPS hosts may be blocked on `CONNECT`.

## Cookies across ports

On `localhost`, login cookie from port `3000` is sent to proxy on `8080` (same site). For separate VMs/hostnames, set `COOKIE_DOMAIN` in `.env` appropriately.
