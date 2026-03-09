# Skynet EPR

An Electronic Progress & Performance Record (EPR) web application built for AIRMAN Academy.

## Project Overview

Skynet EPR is a full-stack platform designed to track student performance and instructor evaluations across aviation license programs (PPL, CPL, ATPL). The application provides real-time performance insights, role-based access control, and an AI-assisted evaluation drafting tool for instructors.

## What is Implemented

- **Level 1 (Core)**: Full CRUD on performance records with Drizzle ORM, Express/TypeScript backend, and React/Tailwind frontend. Includes database seeding with instructors, students, courses, enrollments, and sample EPR records.
- **Level 2A (Progress Summary & Analytics)**: A "Performance Snapshot" card rendering average overall, technical, and non-technical ratings alongside a recent trend timeline for the selected person — computed server-side via aggregation queries.
- **Level 2B (Instructor vs Student Modes)**: A sticky application mode switcher that injects an `x-user-id` header on every API request. The backend independently enforces role rules — students hitting restricted endpoints get a `403 Forbidden` regardless of what the frontend shows.
- **Level 2C (AI Assistant Stub)**: Generates contextual, aviation-specific evaluation remarks based on the scoring matrix. Built as a rule-based engine with tiered logic across score ranges, referencing CRM, situational awareness, and checklist discipline.

## Prerequisites

- Node.js 18+
- PostgreSQL
- `psql` (optional, for manual DB queries)

## Setup

First, ensure PostgreSQL is running and create the database:
```bash
createdb skynet_epr
```

### Backend
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your postgres credentials

# Run migrations and seed
npm run db:generate
npm run db:migrate
npm run db:seed

# Start backend (port 3000)
npm run dev
```

### Frontend
```bash
cd frontend
npm install

# Start frontend dev server (port 5173)
npm run dev
```

## Environment Variables

**Backend (`backend/.env`):**
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgres://user:password@localhost:5432/skynet_epr`)
- `PORT`: Server port (default: `3000`)

**Frontend (`frontend/.env`):**
- `VITE_API_URL`: Backend URL (default: `http://localhost:3000`)

## API Reference

All routes prefixed with `/api`.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/people` | List users (excl. admins). Params: `role`, `search` | All |
| GET | `/api/epr?personId={uuid}` | All EPR records for a person | All |
| GET | `/api/epr/:id` | Single EPR record detail | All |
| POST | `/api/epr` | Create a new EPR record | Instructor / Admin |
| PATCH | `/api/epr/:id` | Update ratings, remarks, or status | Instructor / Admin |
| GET | `/api/epr/summary/:personId` | Aggregated averages + trend for last 3 periods | All |
| POST | `/api/epr/assist` | Generate suggested remarks from scores | Instructor / Admin |

## How I Used AI in This Project

I used Claude as a thinking and scaffolding partner throughout the build — not as something that wrote the project for me.

Concretely, I used it to scaffold the initial folder structure and boilerplate setup (package configs, Drizzle config, Tailwind setup, tsconfig) so I could skip the tedious parts and get into the actual logic faster. I also used it to generate the seed data since writing 10+ realistic aviation-themed user records by hand is just busy work.

Beyond that, I used it as a sounding board for architecture decisions — things like where to draw the line between service and controller logic, how to structure the summary aggregation query cleanly, and how to approach the role enforcement middleware without overcomplicating it.

The actual implementation — the Drizzle schema design, the API logic, the role-based access enforcement, the frontend state management, the UI, the scoring logic for the AI stub — I wrote and debugged myself. When something broke I'd work through it first, and used Claude to help pinpoint specific bugs only after I had a clear idea of where the problem was.