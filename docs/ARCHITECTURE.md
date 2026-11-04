# ALPHA CLASSROOM — Architectural Overview

## 1. System Design

ALPHA CLASSROOM follows a decoupled, monorepo design pattern separating the client-side presentation layer and the server-side API:

```
┌─────────────────────────────────┐
│     Next.js Web Client          │  Port 3000
│  (App Router + Tailwind CSS)    │
└────────────────┬────────────────┘
                 │
                 │ HTTP REST / JSON (api/v1)
                 │
┌────────────────▼────────────────┐
│      NestJS REST API            │  Port 4000
│ (Controllers, Services, Guards) │
└────────────────┬────────────────┘
                 │
                 │ Prisma ORM
                 │
┌────────────────▼────────────────┐
│     PostgreSQL Database         │  Port 5432
│      (alpha_classroom_db)       │
└─────────────────────────────────┘
```

## 2. API Communication
- All REST API endpoints are prefixed with `/api/v1`.
- Standardized CORS allows requests originating from `http://localhost:3000`.
- Health Check Endpoint: `GET /api/v1/health`

## 3. Environment Strategy
- Every sub-application (`frontend` and `backend`) maintains its own `.env.example`.
- Secrets must never be committed to Git.
