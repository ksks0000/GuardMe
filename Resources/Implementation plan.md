# GitHub Repository Structure #

personal-secure-web-gateway/
│
│── apps/
│   │── gateway-backend/          # NestJS application
│   └── dashboard-frontend/       # Angular application
│
│── infrastructure/
│   │── docker/
│   │   │── docker-compose.yml
│   │   └── postgres/
│   │── vmware/
│   │   │── network-diagram.md
│   │   └── setup-guide.md
│   └── proxy-config/
│       └── browser-proxy.md
│
│── docs/
│   │── architecture.md
│   │── threat-model.md
│   │── api-spec.md
│   └── screenshots/
│
│── scripts/
│   │── start-dev.sh
│   └── seed-db.ts
│
│── .env.example
│── README.md
└── LICENSE


# Backend Folder Structure (NestJS) #

gateway-backend/
│ ── src/
│   │ ── main.ts
│   │ ── app.module.ts
│   │
│   │ ── common/
│   │   │ ── guards/
│   │   │ ── interceptors/
│   │   │ ── filters/
│   │   └── utils/
│   │
│   │ ── modules/
│   │   │ ── auth/                 # login, JWT, session verification
│   │   │ ── proxy/                # HTTP forwarding and interception
│   │   │ ── threat/               # VirusTotal integration
│   │   │ ── vault/                # encrypted credential storage
│   │   │ ── siem/                 # logging and event normalization
│   │   └── websocket/             # real-time dashboard events
│   │
│   │ ── prisma/
│   │   │ ── schema.prisma
│   │   └── migrations/
│   │
│   └── config/
│       │ ── database.config.ts
│       └── security.config.ts
│
│ ── test/
└── package.json


# Angular Frontend Structure #

dashboard-frontend/
│── src/app/
│   │── core/
│   │   │── services/
│   │   │   │── auth.service.ts
│   │   │   │── websocket.service.ts
│   │   │   └── api.service.ts
│   │   └── guards/
│   │
│   │── features/
│   │   │── dashboard/
│   │   │── traffic-monitor/
│   │   │── vault/
│   │   └── security-events/
│   │
│   │── shared/
│   │   │── components/
│   │   └── models/
│   │
│   └── app-routing.module.ts

RxJS streams: traffic$, securityEvents$, sessionState$ 

## Prisma Schema (Initial Example) ##

model User {
  id            String   @id @default(uuid())
  username      String   @unique
  password_hash String
  created_at    DateTime @default(now())
  sessions      Session[]
}

model Session {
  id        String   @id @default(uuid())
  user_id   String
  jwt_id    String
  ip        String
  userAgent String
  expiresAt DateTime

  user User @relation(fields: [user_id], references: [id])
}

model TrafficLog {
  id         String   @id @default(uuid())
  user_id    String
  url        String
  verdict    String
  risk_score Int
  timestamp  DateTime @default(now())

  @@index([timestamp])
  @@index([user_id, timestamp])
  @@index([verdict])
}

///////////////////////////////////////////////////////////////

## Phase 0 — Project Bootstrap ##

Goal: runnable backend skeleton.

> nest new gateway-backend
> npm install @prisma/client prisma
> npm install @nestjs/jwt passport passport-jwt
> npm install argon2
> npm install axios
> npm install eventemitter2
> npm install @nestjs/config
> npm install @nestjs/websockets @nestjs/platform-socket.io
> npm install cookie-parser
> npm install axios http-proxy
> npm install uuid

Create modules: auth, proxy, threat, vault, siem, websocket
src/
 ├── app.module.ts
 ├── config/
 ├── database/
 ├── common/

## Phase 1 — Database First + Prisma ##

Steps:
	1. Init prisma (> npx prisma init)
	2. Define Prisma schema - create models: User, Session..
	3. Generate client, DB connection module
	4. Migrate (> npx prisma migrate dev)
	5. Create PrismaService in NestJS

## Phase 2 — Authentication Module ##

Identity before security logic.
Modules: auth/, users/, sessions/
Implement: register, login, Argon2 hashing, JWT cookie, password verification middleware, session table insert
Result: User logs in → session created → cookie issued

## Phase 3 — SIEM Core ##

Create siem.service.ts with functions:
	- logTraffic()
	- logSecurityEvent()
	- emitEvent()

## Phase 4 — Proxy Module ##

Modules: proxy/, inspection/, policy/
Proxy flow:
Request
 → auth check
 → threat scan
 → decision
 → log
 → forward

Implement:
	- HTTP interceptor
	- forwarding using Axios
	- block page

## Phase 5 — Threat Module ##

Proxy calls: threatService.scanUrl(url)
Return: SAFE | SUSPICIOUS | MALICIOUS (| UNVERIFIED)?

## Phase 6 — WebSocket Gateway ##

Emit events from SIEM: this.server.emit("TRAFFIC_LOG", data);
Angular subscribes.

## Phase 7 — Vault Module (Crypto) ##

Implement:
	- key derivation (Argon2)
	- AES-256-GCM encrypt/decrypt
	- CRUD credentials

## Phase 8 — Zero Trust Hardening ##

Add:
	- re-auth guard
	- session freshness
	- device fingerprint validation

////////////////////////////////////////////////

Proxy implementation 


Auth + Vault Crypto Implementation Walkthrough


Event-Based WebSocket Model


