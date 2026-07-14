# GuardMe VMware Lab — Setup Guide

This guide covers the **two-VM lab** and a **single-machine** setup for local development.

---

## Prerequisites

| Tool | Version (minimum) | Used on |
|------|-------------------|---------|
| VMware Workstation | 16+ / 12+ | Host |
| Guest OS | Windows 10/11 | Both VMs |
| Node.js | 20+ (LTS) | Gateway VM |
| npm | 10+ | Gateway VM |
| Docker Desktop / Docker Engine | recent | Gateway VM |
| Git | any | Gateway VM |

Optional on User VM: only a modern browser (Firefox recommended for easy proxy UI).

---

## Part A — Two-VM lab

### A.1 Create the virtual network

1. Open **Edit → Virtual Network Editor** (Workstation) network settings.
2. Create / enable a **Host-only** network, e.g. `VMnet1`:
   - Subnet: `192.168.56.0`
   - Mask: `255.255.255.0`
   - DHCP: optional (static IPs below are clearer for testing)

### A.2 Gateway VM

**Adapters**

| Adapter | Type | Address |
|---------|------|---------|
| NIC 1 | NAT or Bridged | DHCP (outbound internet for VirusTotal + sites) |
| NIC 2 | Host-only (`VMnet1`) | `192.168.56.10/24` |

**Software install**

1. Install Node.js LTS, Git, and Docker.
2. Clone the repository:

```bash
git clone <guardme-repo-url> GuardMe
cd GuardMe
```

3. Start PostgreSQL:

```bash
cd infrastructure/docker
cp .env.example .env
docker compose --profile dev up -d
```

4. Configure the backend:

```bash
cd ../../apps/gateway-backend
cp .env.example .env
```

Edit `.env` for the lab (security-sensitive values first):

```env
JWT_SECRET="<long-random-string>"
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/gateway_db?schema=public"

# Dashboard will be opened from the User VM at the gateway host-only IP
API_CORS_ORIGINS=http://192.168.56.10:4200,http://localhost:4200
WS_CORS_ORIGINS=http://192.168.56.10:4200,http://localhost:4200

COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

VIRUSTOTAL_API_KEY="<your-key>"
```

5. Install, migrate, start API + proxy:

```bash
npm install
npm run prisma:migrate
npm run start:dev
```

Confirm logs show API on `3000` and proxy on `8080`.

6. Configure and start the dashboard so it is reachable from the User VM:

```bash
cd ../dashboard-frontend
npm install
```

Point the frontend at the Gateway host-only IP (edit `src/environments/environment.ts` for the lab session):

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://192.168.56.10:3000',
  wsUrl: 'http://192.168.56.10:3000/events',
  reAuthTimeoutMinutes: 15,
};
```

Serve on all interfaces:

```bash
npx ng serve --host 0.0.0.0 --port 4200
```

**Gateway VM** — allow inbound on host-only NIC only:

- TCP `3000`, `8080`, `4200`
- Do **not** expose `5432` to the User VM or WAN

### A.3 User VM

**Adapters**

| Adapter | Type | Address |
|---------|------|---------|
| NIC 1 | Host-only (`VMnet1`) | `192.168.56.20/24` |


**Connectivity check**

```bash
ping 192.168.56.10
```

Open in the User VM browser:

- Dashboard: `http://192.168.56.10:4200`
- API health (optional): `http://192.168.56.10:3000/health`

**Browser proxy**

| Setting | Value |
|---------|-------|
| HTTP proxy | `192.168.56.10` |
| Port | `8080` |
| Also use for HTTPS | Yes |
| No proxy for | `192.168.56.10`, `localhost`, `127.0.0.1` |

Full browser steps: [browser-proxy.md](../proxy-config/browser-proxy.md).

### A.4 Demo flow on the User VM

1. Register / sign in at `http://192.168.56.10:4200`.
2. Browse an HTTP site (e.g. `http://example.com`) — accept the **proxy login** with the same credentials.
3. Confirm live traffic appears in the dashboard.
4. Trigger a block / warning with a known malicious or suspicious test URL (VirusTotal-backed).
5. Check tabs (Dashboard, Traffic, Rules, Security, Vault).
6. Open Analytics and Behavior tabs after enough browsing history to see baseline / anomalies.


## Part B — Single-machine setup

All services stay on `localhost`.

### Steps

```bash
# 1) Database
cd infrastructure/docker
cp .env.example .env   # first time only
docker compose --profile dev up -d

# 2) Backend
cd ../../apps/gateway-backend
cp .env.example .env   # first time only - set JWT_SECRET and VIRUSTOTAL_API_KEY
npm install
npm run prisma:migrate
npm run start:dev

# 3) Frontend (second terminal)
cd ../dashboard-frontend
npm install
npm start
```

Then configure the browser proxy to `localhost:8080` and open `http://localhost:4200`.

Keep `environment.ts` on localhost:

```typescript
apiBaseUrl: 'http://localhost:3000',
wsUrl: 'http://localhost:3000/events',
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Dashboard loads but login fails / CORS errors | `API_CORS_ORIGINS` missing User VM origin | Add `http://192.168.56.10:4200` (exact scheme + host + port) |
| WebSocket never connects | `WS_CORS_ORIGINS` or wrong `wsUrl` | Match dashboard origin; use gateway IP in `environment.ts` |
| Proxy always 407 | Wrong credentials or no account | Register on dashboard first; use same username/password in proxy prompt |
| Cannot reach dashboard from User VM | `ng serve` bound to localhost only | Use `npx ng serve --host 0.0.0.0 --port 4200` |
| VirusTotal / blocks never happen | Missing API key or no internet on Gateway | Set `VIRUSTOTAL_API_KEY`; verify Gateway NAT/bridged NIC |
| Postgres connection refused | Container not up | `docker compose --profile dev ps` and check health |
| Cookie / session oddities across IPs | Opening dashboard via mixed `localhost` and `192.168.56.10` | Pick one origin and stick to it for the session |

