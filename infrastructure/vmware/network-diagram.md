# GuardMe VMware Lab — Network Diagram

Recommended lab layout: two VMs on a private host-only segment, with the Gateway VM also attached to NAT (or bridged) so it can reach VirusTotal and the public internet.

## Topology

```
                        ┌───────────────────────────────┐
                        │           Internet            │
                        │                               │
                        │  VirusTotal API   Websites    │
                        └───────▲──────────────▲────────┘
                                │              │
               Reputation Lookup│              │Allowed Traffic
                                │              │
┌───────────────────────────────────────────────────────────────────────────┐
│          Host-only Network (192.168.56.0/24)                              │
│                                                                           │
│  ┌────────────────────┐           ┌────────────────────────────────────┐  │
│  │ User VM            │           │ Gateway VM                         │  │
│  │ 192.168.56.20      │           │ 192.168.56.10                      │  │
│  │                    │           │                                    │  │
│  │  Browser           │──────────►│ Angular Dashboard (:4200)          │  │
│  │                    │           │       │                            │  │
│  │                    │──────────►│ NestJS API (:3000) ────────────────┼──┘
│  │                    │ REST/WS   │       │                            │  │
│  │                    │           │       ▼                            │  │
│  │                    │           │ PostgreSQL (:5432)                 │  │
│  │                    │           │                                    │  │
│  │                    │──────────►│ Forward Proxy (:8080) ─────────────┼──┘
│  │                    │ HTTP(S)   │                                    │  │
│  └────────────────────┘ via Proxy └────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

## Address plan

| Node | Role | Suggested IP | Notes |
|------|------|--------------|-------|
| Gateway VM | NestJS, Docker Postgres, Angular | `192.168.56.10` | Dual NIC: host-only + NAT/bridged for outbound internet |
| User VM | Browser only | `192.168.56.20` | Host-only (or same private network); no direct internet required if all traffic goes through the proxy |

## Ports exposed on the Gateway VM

| Port | Service | Who connects |
|------|---------|--------------|
| `3000` | Management API + WebSocket `/events` | Dashboard (User VM or Gateway VM browser) |
| `8080` | Forward proxy | User VM browser proxy settings |
| `4200` | Angular dashboard (`ng serve`) | User VM browser |
| `5432` | PostgreSQL | Localhost on Gateway VM only |

## Trust boundary

```
User VM ──private──► Gateway VM ──NAT/bridged──► Internet
         (inspected)              (outbound only)
```

The User VM should treat the Gateway as the only path to the internet (browser proxy).

## Single-machine setup

When VMware is unavailable, run everything on one host with loopback addressing:

| Service | Address |
|---------|---------|
| API / WebSocket | `http://localhost:3000` |
| Proxy | `localhost:8080` |
| Dashboard | `http://localhost:4200` |
| Postgres | `localhost:5432` (Docker) |

