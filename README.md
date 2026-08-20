# ⚡ DevPulse

<p align="center">
  <strong>Real-Time Incident Management & Collaboration Platform</strong>
</p>

<p align="center">
  Track incidents • Collaborate in real time • Enforce access control • Preserve operational history
</p>

<p align="center">

![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Realtime-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Yjs](https://img.shields.io/badge/Collaboration-Yjs-8A2BE2?style=for-the-badge)
![Docker](https://img.shields.io/badge/Infrastructure-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-8%2F8%20Passing-3F8F6F?style=for-the-badge)

</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start-2-minutes)
- [Features](#-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [Testing](#-testing)
- [Deployment](#-production-build)
- [Engineering Decisions](#-engineering-decisions)
- [Roadmap](#-roadmap)

---

## 🎯 Overview

**DevPulse** is a full-stack, real-time incident management platform designed for engineering teams handling application and infrastructure incidents.

It provides a centralized workflow for:

- creating and tracking incidents
- managing incident lifecycle and status
- collaborating through comments
- sharing a live per-incident notebook
- maintaining an audit history
- enforcing role-based access control
- synchronizing updates in real time
- securely resetting passwords
- persisting application state with PostgreSQL
- distributing realtime events through Redis

The platform is designed around a practical incident-response workflow:

```text
Detect → Create Incident → Investigate → Collaborate → Update Status → Resolve → Audit & Review
```

---

## 🚀 Quick Start (2 minutes)

### Prerequisites
- Node.js 18+ and npm
- Docker Desktop
- Git

### One-Command Setup

```bash
# Clone and install
git clone https://github.com/abirsarkar-wp/devpulse.git
cd devpulse

# Start databases
docker compose up -d

# Backend setup
cd backend && npm install
echo "DATABASE_URL=postgresql://devpulse:devpulse123@localhost:5432/devpulse
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
REDIS_URL=redis://localhost:6379
PORT=4000" > .env

npx prisma migrate deploy
npm run dev
```

In a new terminal:

```bash
# Frontend setup
cd frontend && npm install
npm run dev
```

**Done!** Open [http://localhost:5173](http://localhost:5173)

**Test credentials:**
- Email: `test@example.com` (requires manual user creation via database)
- Or sign up if enabled

---

# ✨ Features

## 🔐 Authentication & Security

- JWT-based authentication
- Access and refresh tokens
- bcrypt password hashing
- Protected REST API routes
- Protected frontend routes
- Role-aware frontend controls
- Backend-enforced authorization
- Secure password reset workflow
- Expiring password-reset tokens
- Reset-token invalidation after successful password reset
- Public signup disabled in the current product design

---

## 👥 Role-Based Access Control

DevPulse supports three roles:

| Capability | VIEWER | MEMBER | ADMIN |
|---|:---:|:---:|:---:|
| View incidents | ✅ | ✅ | ✅ |
| View comments | ✅ | ✅ | ✅ |
| View shared notebook | ✅ | ✅ | ✅ |
| Create incidents | ❌ | ✅ | ✅ |
| Update incident status | ❌ | ✅ | ✅ |
| Add comments | ❌ | ✅ | ✅ |
| Edit shared notebook | ❌ | ✅ | ✅ |
| Review audit history | ✅ | ✅ | ✅ |

Authorization is enforced by the backend, while the frontend also provides role-aware controls.

```text
Frontend Permission Controls
          +
Backend Authorization
          ↓
    Actual Access Control
```

---

# 🚨 Incident Management

Each incident contains:

- title
- description
- status
- creator
- timestamps
- comments
- audit history
- shared collaborative notebook

### Incident Lifecycle

```text
OPEN
  │
  ▼
IN_PROGRESS
  │
  ▼
RESOLVED
  │
  ▼
CLOSED
```

Important status transitions are recorded in the audit trail.

---

# 📝 Shared Collaborative Notebook

Every incident includes a **shared collaborative notebook** that acts as a common engineering scratchpad during incident response.

Typical use cases include:

- investigation notes
- debugging findings
- hypotheses
- troubleshooting steps
- commands and results
- recovery procedures
- temporary checklists
- important observations

Multiple authorized users viewing the same incident can edit the notebook simultaneously.

## 🧠 CRDT-Based Collaboration

The notebook uses **Yjs CRDTs** instead of a naive last-write-wins model.

This allows concurrent edits to be merged rather than one user's update simply replacing another user's work.

```text
User A
  │
  ▼
Yjs Document
  │
  ▼
Socket.io
  │
  ▼
Incident Room
  │
  ├──────────────┐
  ▼              ▼
User B          User C
```

### Why CRDT?

A naive shared editor can lose concurrent work:

```text
User A edit
      ↓
User B edit
      ↓
Last write wins ❌
```

With Yjs:

```text
User A edit ─┐
             ├──→ CRDT merge ──→ Shared state
User B edit ─┘
```

The notebook is therefore a real-time collaborative data structure rather than a simple text field.

---

# 💾 Persistent Notebook State

Notebook state is persisted to PostgreSQL.

```text
User Edit
   ↓
Yjs Incremental Update
   ↓
Socket.io
   ↓
Connected Collaborators
   ↓
Debounced Persistence
   ↓
PostgreSQL
```

The persisted notebook is designed to survive:

- browser refresh
- browser close/reopen
- reconnects
- backend restarts

Inactive in-memory collaboration documents may be cleaned up, but the persisted incident notebook remains in PostgreSQL until explicitly removed.

---

# ⚡ Real-Time Incident Collaboration

DevPulse uses **Socket.io** for real-time incident communication.

Real-time events currently include:

- incident status changes
- new comments
- collaborative notebook updates
- notebook presence updates

Example:

```text
User A changes status
        ↓
Express API
        ↓
PostgreSQL
        ↓
Audit Log
        ↓
Socket.io
        ↓
Incident Room
        ↓
User B + User C
```

No manual page refresh is required.

---

# 🧩 Incident-Specific Socket Rooms

Each incident uses its own realtime room:

```text
incident:<incidentId>
```

This keeps events scoped to the relevant incident.

```text
Incident A update
      ↓
incident:A
      ↓
Only clients working on Incident A
```

This avoids broadcasting unrelated incident activity to every connected user.

---

# ⚡ Redis-Backed Realtime Architecture

Socket.io uses the Redis adapter so multiple backend instances can participate in realtime event delivery.

```mermaid
flowchart LR

    A[Client A]
    B[Client B]
    C[Client C]

    S1[Backend Instance 1]
    S2[Backend Instance 2]

    R[(Redis)]

    A --> S1
    B --> S2
    C --> S2

    S1 <--> R
    S2 <--> R
```

This provides a scalable foundation beyond a single backend process.

---

# 🧾 Audit Logging

DevPulse records important incident operations in an audit trail.

Examples:

```text
INCIDENT_CREATED
STATUS_CHANGED_TO_IN_PROGRESS
STATUS_CHANGED_TO_RESOLVED
COMMENT_ADDED
```

Each audit record includes:

- action
- incident
- user
- timestamp

Example incident history:

```text
INCIDENT_CREATED
       ↓
STATUS_CHANGED_TO_IN_PROGRESS
       ↓
COMMENT_ADDED
       ↓
STATUS_CHANGED_TO_RESOLVED
```

---

# 🫀 DevPulse System Pulse

The dashboard includes a data-driven **System Pulse** visualization.

When open incidents exist:

```text
OPEN incidents > 0
        ↓
Red animated pulse
```

When there are no open incidents:

```text
OPEN incidents = 0
        ↓
Green flat pulse
        ↓
ALL CLEAR
```

The pulse is derived from actual incident data rather than placeholder metrics.

---

# 🎨 Control-Room UI

DevPulse is designed as an engineering control room rather than a generic CRUD dashboard.

The dashboard organizes incidents into:

```text
┌────────────┬──────────────┬────────────┬──────────┐
│ OPEN       │ IN PROGRESS  │ RESOLVED   │ CLOSED   │
├────────────┼──────────────┼────────────┼──────────┤
│ Incident A │ Incident C   │ Incident D │          │
│ Incident B │ Incident E   │            │          │
└────────────┴──────────────┴────────────┴──────────┘
```

The frontend includes:

- responsive incident board
- modern control-room layout
- status badges
- system pulse visualization
- activity timeline
- collaborative notebook
- modern authentication screens
- loading/error states
- subtle depth and 3D hover interactions
- responsive layouts
- accessible focus states
- reduced-motion support

---

# 🔄 Password Reset

The password reset workflow is:

```mermaid
sequenceDiagram

    participant U as User
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL

    U->>F: Forgot Password
    F->>A: POST /auth/forgot-password
    A->>A: Generate secure token
    A->>DB: Save token + expiry
    A-->>F: Reset response

    U->>F: Submit new password
    F->>A: POST /auth/reset-password
    A->>DB: Validate token
    A->>A: bcrypt.hash(newPassword)
    A->>DB: Update password + clear token
    A-->>F: Password reset successful
```

The reset token is handled internally by the reset flow and is not presented as a visible reset-token input in the UI.

For a production deployment, reset links should be delivered through a secure email service.

---

# 🛠️ Tech Stack

## Frontend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| UI Framework | React 19 | Component-based UI |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast development & builds |
| Routing | React Router 7 | Client-side navigation |
| HTTP Client | Axios | API requests |
| State Management | React Context | Authentication state |
| Server State | React Query 5 | API caching & sync |
| Real-time | Socket.io Client | Live collaboration |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Collaboration | Yjs | CRDT data structures |

## Backend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 18+ | JavaScript server |
| Framework | Express 5 | HTTP server |
| Language | TypeScript | Type safety |
| Authentication | JWT | Token-based auth |
| Password | bcrypt | Secure hashing |
| Real-time | Socket.io | Bi-directional communication |
| Collaboration | Yjs | CRDT data structures |

## Infrastructure & Database

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Database | PostgreSQL 16 | Relational data storage |
| ORM | Prisma 7 | Type-safe database access |
| Cache/Pub-Sub | Redis 7 | Socket.io adapter & sessions |
| Containerization | Docker & Compose | Local dev & deployment |

## Development & Testing

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Testing Framework | Vitest | Fast unit & integration tests |
| HTTP Testing | Supertest | API endpoint testing |
| Linting | ESLint | Code quality |

---

# 📡 API Reference

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "MEMBER"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Headers:**
```
Authorization: Bearer <refreshToken>
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123"
}
```

## Incident Endpoints

### POST /incidents
Create a new incident (requires MEMBER or ADMIN).

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Database Connection Timeout",
  "description": "Production database is not responding to queries"
}
```

### GET /incidents
List all incidents (requires authentication).

**Query Parameters:**
```
?status=OPEN    // Filter by status
?skip=0         // Pagination offset
?take=10        // Pagination limit
```

### GET /incidents/:id
Get incident details (requires authentication).

### PATCH /incidents/:id/status
Update incident status (requires MEMBER or ADMIN).

**Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Valid statuses:** `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

### POST /incidents/:id/comments
Add comment to incident (requires MEMBER or ADMIN).

**Request:**
```json
{
  "content": "Started investigating the issue"
}
```

### GET /incidents/:id/comments
Get incident comments (requires authentication).

## Utility Endpoints

### GET /health
Health check (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-20T10:00:00Z"
}
```

### GET /me
Get authenticated user info (requires authentication).

---

# 🔌 Socket.io Events

## Client → Server

| Event | Payload | Purpose |
|-------|---------|---------|
| `join_incident` | `{ incidentId }` | Join incident room for live updates |
| `leave_incident` | `{ incidentId }` | Leave incident room |
| `notes:join` | `{ incidentId }` | Start collaborative notebook session |
| `notes:update` | `{ incidentId, updates }` | Send notebook CRDT updates |
| `notes:leave` | `{ incidentId }` | Leave notebook session |

## Server → Client

| Event | Payload | Purpose |
|-------|---------|---------|
| `incident:updated` | Incident data | Incident details changed |
| `comment:added` | Comment data | New comment posted |
| `notes:sync` | Yjs state | Full notebook sync |
| `notes:update` | Incremental updates | Collaborative edits |
| `presence:update` | User presence data | Who's editing the notebook |
| `notes:error` | Error message | Notebook operation failed |

---

```text
devpulse/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── __tests__/
│       ├── lib/
│       ├── middleware/
│       ├── routes/
│       └── index.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       ├── pages/
│       ├── App.tsx
│       └── main.tsx
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# 🏗️ Architecture

## Frontend Architecture

```mermaid
flowchart TD

    A[React Application]

    A --> B[React Router]
    A --> C[AuthContext]
    A --> D[React Query]
    A --> E[Axios API Layer]
    A --> F[Socket.io Client]

    B --> G[Protected Routes]
    C --> H[JWT Session State]

    D --> I[Server State]
    E --> J[Express REST API]
    F --> K[Socket.io Server]

    J --> L[RBAC Middleware]
    F --> M[Incident Rooms]
```

## Backend Architecture

```mermaid
flowchart TD

    A[React Client]

    A --> B[REST API]
    A --> C[Socket.io]

    B --> D[JWT Authentication]
    B --> E[RBAC Middleware]
    B --> F[Incident Routes]

    F --> G[Prisma ORM]
    G --> H[(PostgreSQL)]

    F --> I[Audit Logging]

    C --> J[Incident Rooms]
    C --> K[Yjs Collaboration]
    C --> L[Redis Adapter]

    L --> M[(Redis)]
    K --> H
```

---

# 🚀 Getting Started

## Prerequisites

- **Node.js** 18+ with npm
- **Docker Desktop** (for PostgreSQL and Redis)
- **Git**

## Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/abirsarkar-wp/devpulse.git
cd devpulse
```

## Step 2: Start Databases

From the project root:

```bash
docker compose up -d
```

Verify services are running:

```bash
docker compose ps
```

Expected output:
```
devpulse-postgres-1   postgres:16    Up
devpulse-redis-1      redis:7        Up
```

To view logs:
```bash
docker compose logs -f
```

## Step 3: Configure and Start Backend

```bash
cd backend
npm install
```

Create `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://devpulse:devpulse123@localhost:5432/devpulse

# JWT Secrets (generate secure values for production)
JWT_ACCESS_SECRET=your-secure-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-chars

# Redis (optional, defaults to localhost:6379)
REDIS_URL=redis://localhost:6379

# Server Port
PORT=4000

# Environment
NODE_ENV=development
```

Initialize database:

```bash
npx prisma migrate deploy
# For new migrations in development:
# npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

Backend will be running at [http://localhost:4000](http://localhost:4000)

Health check:
```bash
curl http://localhost:4000/health
```

## Step 4: Configure and Start Frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be running at [http://localhost:5173](http://localhost:5173)

## Step 5: Create a Test User (Optional)

For testing, you can create a user directly in PostgreSQL:

```bash
docker compose exec postgres psql -U devpulse -d devpulse
```

Then in the psql prompt:

```sql
INSERT INTO "User" (id, email, "passwordHash", role, "createdAt")
VALUES (
  gen_random_uuid(),
  'test@example.com',
  '$2b$10$...your-bcrypt-hash...',
  'MEMBER',
  NOW()
);
```

Or use the API to register (if public signup is enabled):

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

# 🧪 Testing

## Backend TypeScript

```bash
cd backend
npx tsc --noEmit
```

## Backend Tests

```bash
npm test
```

Current automated suite:

```text
2 test files
8 tests
8 passed
```

The suite covers:

- removed public signup endpoint
- login validation
- successful authentication
- invalid credentials
- VIEWER read access
- VIEWER creation restriction
- VIEWER status-update restriction
- unauthenticated request rejection

---

# 🏭 Production Build

## Frontend

```bash
cd frontend
npx tsc --noEmit
npm run build
```

The production build is generated in:

```text
frontend/dist/
```

## Backend

```bash
cd backend
npx tsc
```

---

# 🧠 Engineering Decisions

## Why PostgreSQL?

The domain contains strong relationships between:

```text
Users
 ↓
Incidents
 ↓
Comments
 ↓
Audit Logs
 ↓
Shared Notes
```

PostgreSQL provides relational integrity, transactional consistency, and durable persistence.

---

## Why Prisma?

Prisma provides:

- type-safe database access
- schema-driven development
- database migrations
- generated TypeScript client

---

## Why Redis?

Redis is used by the Socket.io adapter to distribute realtime events between backend instances.

This creates a foundation for horizontally scalable realtime communication.

---

## Why Socket.io?

Polling repeatedly asks:

```text
"Did anything change?"
```

Socket.io allows the server to push updates immediately:

```text
"Something changed."
```

This reduces unnecessary polling and improves responsiveness.

---

## Why Yjs?

A naive shared editor can lose concurrent work:

```text
User A edit
      ↓
User B edit
      ↓
Last write wins ❌
```

Yjs provides conflict-free replicated data structures that merge concurrent updates.

This makes it suitable for an incident notebook where multiple engineers may write notes simultaneously.

---

# 📈 Scalability Considerations

The current architecture provides a foundation for running multiple backend instances:

```text
                ┌─────────────┐
                │    Redis    │
                └──────┬──────┘
                       │
              ┌────────┴────────┐
              │                 │
        Backend #1         Backend #2
              │                 │
           Clients           Clients
```

Potential future improvements include:

- managed PostgreSQL
- managed Redis
- rate limiting
- structured logging
- centralized monitoring
- distributed tracing
- centralized error reporting
- CDN-backed frontend
- production CI/CD

---

# 🛡️ Security Model

DevPulse uses layered security.

### Authentication

JWT tokens verify user identity.

### Password Security

Passwords are stored as bcrypt hashes.

### Authorization

RBAC middleware controls protected operations.

### Frontend Protection

Protected routes and role-aware controls prevent unauthorized actions from being presented.

### Socket Security

Socket.io connections use JWT authentication.

### Password Reset

Reset tokens:

- are securely generated
- expire
- are invalidated after successful password reset
- are not shown as a visible reset-token field

### Collaboration Security

Collaborative notebook access is tied to authenticated users and validated incident context.

---

# 🧪 Manual Testing Checklist

## Authentication

- [x] Login
- [x] Logout
- [x] JWT authentication
- [x] Protected routes
- [x] Password reset
- [x] Show/Hide password
- [x] Public signup removed

## Authorization

- [x] VIEWER read-only behavior
- [x] MEMBER incident creation
- [x] MEMBER status updates
- [x] MEMBER comments
- [x] ADMIN permissions

## Incidents

- [x] Create incident
- [x] List incidents
- [x] Filter incidents
- [x] View details
- [x] Update status
- [x] Add comments
- [x] Audit history

## Realtime

- [x] Socket.io connection
- [x] Incident-specific rooms
- [x] Live status updates
- [x] Live comments
- [x] Redis adapter
- [x] Shared incident notebook
- [x] Yjs synchronization
- [x] Collaborative presence

## Infrastructure

- [x] PostgreSQL
- [x] Redis
- [x] Docker Compose
- [x] Prisma migrations

## Quality

- [x] Backend TypeScript validation
- [x] Frontend TypeScript validation
- [x] Automated backend tests
- [x] Production frontend build

---

# 🚧 Current Limitations

DevPulse is currently a portfolio-grade engineering project rather than a production SaaS deployment.

Potential future improvements include:

- production email delivery for password reset
- rate limiting
- stricter production CORS
- secure production cookie strategy
- structured logging
- centralized monitoring
- dedicated test database
- CI/CD deployment
- production observability
- incident notifications
- external service integrations
- advanced incident analytics
- richer collaborative document editing
- document version history

---

# 🗺️ Roadmap

## ✅ Completed

- [x] Full-stack React + Express architecture
- [x] PostgreSQL + Prisma
- [x] JWT authentication
- [x] Role-based authorization
- [x] Incident lifecycle
- [x] Comments
- [x] Audit trail
- [x] Socket.io realtime updates
- [x] Incident-specific Socket.io rooms
- [x] Redis adapter
- [x] Shared per-incident collaborative notebook
- [x] Yjs CRDT synchronization
- [x] Collaborative presence
- [x] Persistent notebook state
- [x] Password reset
- [x] Dockerized PostgreSQL + Redis
- [x] Automated authentication/RBAC tests
- [x] Modern control-room UI

## 🔜 Future

- [ ] Production deployment
- [ ] GitHub Actions CI/CD
- [ ] Rate limiting
- [ ] Structured logging
- [ ] Observability and monitoring
- [ ] Email-based password recovery
- [ ] Incident notifications
- [ ] Service integrations
- [ ] Advanced incident analytics
- [ ] Rich collaborative document editor
- [ ] Document/version history

---

# 📸 Screenshots

Recommended repository structure:

```text
docs/
├── screenshots/
│   ├── dashboard.png
│   ├── incident-details.png
│   ├── shared-notebook.png
│   ├── login.png
│   └── password-reset.png
└── demo/
    └── devpulse-demo.gif
```

Add your screenshots here:

### Dashboard

![DevPulse Dashboard](docs/screenshots/dashboard.png)

### Incident Details

![DevPulse Incident Details](docs/screenshots/incident-details.png)

### Shared Notebook

![DevPulse Shared Notebook](docs/screenshots/shared-notebook.png)

### Login

![DevPulse Login](docs/screenshots/login.png)

---

# 🎥 Demo

A short GIF or video should demonstrate:

```text
Login
  ↓
Dashboard
  ↓
Open Incident
  ↓
Open the same incident in another browser
  ↓
Change status
  ↓
Observe realtime update
  ↓
Add comment
  ↓
Open Shared Notebook
  ↓
Edit from both users
  ↓
Observe synchronized changes
  ↓
Review audit history
```

Example:

```markdown
![DevPulse Demo](docs/demo/devpulse-demo.gif)
```

---

# 📦 Repository

**GitHub:**

https://github.com/abirsarkar-wp/devpulse

---

# 👨‍💻 Author

## Abir Sarkar

**M.Tech — Information Systems and Security Engineering**  
National Institute of Technology, Jamshedpur

- LinkedIn: https://www.linkedin.com/in/abir-sarkar-1b814a404
- GitHub: https://github.com/abirsarkar-wp

---

# ⭐ Project Highlights

DevPulse was built to demonstrate practical software engineering beyond basic CRUD development.

```text
React + TypeScript
        +
Express + TypeScript
        +
PostgreSQL + Prisma
        +
JWT + RBAC
        +
Socket.io
        +
Redis
        +
Yjs CRDT Collaboration
        +
Docker
        +
Automated Testing
```

The project demonstrates how authentication, authorization, relational persistence, realtime communication, distributed event delivery, collaborative editing, auditability, testing, infrastructure, and frontend engineering can be integrated into one full-stack system.

---

<p align="center">
  <strong>⚡ DevPulse — Know the incident. Feel the pulse. Act together.</strong>
</p>
```


