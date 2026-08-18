# DevPulse

DevPulse is a full-stack incident management application for tracking incidents, monitoring status changes, collaborating through comments, maintaining an audit trail, and delivering real-time updates to connected users.

The project is built as a React + TypeScript frontend with an Express + TypeScript backend, PostgreSQL persistence through Prisma, JWT-based authentication and role-based access control, and Socket.io + Redis for real-time incident updates.

---

## Features

- User signup and login
- JWT access and refresh tokens
- Password hashing with bcrypt
- Role-based access control
  - ADMIN
  - MEMBER
  - VIEWER
- Incident creation and listing
- Incident filtering by status
- Incident detail view
- Incident status updates
- Comments on incidents
- Audit logging
- Real-time incident updates with Socket.io
- Redis pub/sub adapter for Socket.io
- Protected frontend routes
- Role-aware frontend UI
- Loading and error states
- Automated backend tests

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Socket.io Client

### Backend

- Node.js
- Express
- TypeScript
- JWT
- bcrypt
- Socket.io

### Database & Infrastructure

- PostgreSQL
- Prisma ORM
- Redis
- Docker / Docker Compose

### Testing

- Vitest
- Supertest

---

## Architecture

```mermaid
flowchart TD
    A[React Frontend] --> B[Axios REST Client]
    A --> C[Socket.io Client]

    B --> D[Express API]
    C --> E[Socket.io Server]

    D --> F[JWT Authentication]
    D --> G[Role-Based Authorization]

    D --> H[Prisma ORM]
    H --> I[(PostgreSQL)]

    E --> J[Redis Adapter]
    J --> K[(Redis)]

    E --> L[Incident Rooms]
    L --> C