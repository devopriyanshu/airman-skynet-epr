# Skynet EPR

An Electronic Progress & Performance Record (EPR) web application built for AIRMAN Academy.

## Project Overview

Skynet EPR is a full-stack platform designed to track student performance and instructor evaluations. The application allows real-time insights into student progression across various aviation license programs (PPL, CPL, etc.).

## What is Implemented

- **Level 1 (Core)**: Full CRUD on performance records with Drizzle ORM, Express/TypeScript backend, and React/Tailwind frontend. Includes database seeding with instructors and students.
- **Level 2A (Progress Summary & Analytics)**: A "Performance Snapshot" rendering average overall, technical, and non-technical ratings alongside a recent trend timeline for the selected user.
- **Level 2B (Instructor vs Student Modes)**: A sticky application mode switcher that applies authorization via an injected `x-user-id` header to seamlessly preview exactly what Students see versus Instructors and System Administrators.
- **Level 2C (AI Assistant Stub)**: Auto-generates sophisticated, contextual aviation evaluations based directly on the scoring matrix to vastly reduce instructor cognitive load during reporting.

## Prerequisites

- Node.js 18+
- PostgreSQL
- `psql` (optional, for manual DB queries)

## Setup

First, ensure PostgreSQL is running. Open a terminal and create the database if it doesn't exist:

```bash
createdb skynet_epr
```

### Backend

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env if you changed your postgres credentials (defaults to user/password on localhost)

# Run database migrations and seed script
npm run db:generate
npm run db:migrate
npm run db:seed

# Start the backend server (runs on port 3000)
npm run dev
```

### Frontend

```bash
cd frontend
npm install

# Start the frontend dev server (runs on port 5173)
npm run dev
```

## Environment Variables

**Backend (`backend/.env`):**
- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgres://user:password@localhost:5432/skynet_epr`)
- `PORT`: Server port (default: 3000)

**Frontend (`frontend/.env`):**
- `VITE_API_URL`: Backend URL (default: `http://localhost:3000`)

## API Reference

All backend routes are prefixed with `/api`.

- `GET /api/people`
  - Retrieves a list of users (excluding admins).
  - Query Params: `role` (student | instructor), `search` (name or email substring).
- `GET /api/epr?personId={uuid}`
  - Retrieves performance records for a specific person.
- `GET /api/epr/:id`
  - Retrieves a specific performance record.
- `POST /api/epr`
  - Creates a new performance record (Instructors/Admins only).
- `PATCH /api/epr/:id`
  - Updates an existing performance record (Instructors/Admins only).
- `GET /api/epr/summary/:personId`
  - Retrieves average ratings and a trend summary for recent submitted records.
- `POST /api/epr/assist`
  - AI stub that calculates and generates suggested technical feedback based on rating scores.

## How I used AI in this project

Claude (and the Antigravity agent) was used to rapidly scaffold the project structure, generate boilerplate (including package configurations, build tools, Tailwind setup), write SQL schema patterns via Drizzle, construct TypeScript types, and generate realistic sample data (seed.ts) mimicking aviation scenarios. All code—including the custom glassmorphism aesthetic and UI logic—was reviewed, audited, and strictly implemented according to the required specifications before submission.
# airman-skynet-epr
