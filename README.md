# ALPHA CLASSROOM

Centralized educational platform engineered for **Alpha Coding**.

ALPHA CLASSROOM is built using a clean monorepo architecture separating the frontend client and the backend REST API.

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Express
- **Database & ORM:** PostgreSQL (v18+), Prisma ORM
- **Version Control:** Git

---

## Directory Overview

```
ALPHA CLASSROOM/
├── backend/              # NestJS backend API service (Port: 4000)
├── frontend/             # Next.js frontend web application (Port: 3000)
├── docs/                 # Architectural specifications and phase documentation
├── .gitignore            # Root Git ignore rules
├── .env.example          # Root environment template
├── PROJECT_PROGRESS.md   # Phased development tracking
└── README.md             # Project documentation
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v20+ recommended, v26 supported)
- npm (v10+)
- Git
- PostgreSQL 16+ (running locally on port 5432)

### 1. Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
- The backend will start on **`http://localhost:4000`**.
- Health Check: **`http://localhost:4000/api/v1/health`**

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- The frontend will start on **`http://localhost:3000`**.

---

## Development Principles
- **Local-First Development:** Runs entirely locally during initial phases.
- **Strict Separation of Concerns:** Frontend and backend are completely decoupled.
- **Environment Isolation:** Sensitive variables are managed via local `.env` files (never committed).
- **Phased Delivery:** Structured implementation with rigorous testing per phase.
