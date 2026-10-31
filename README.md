# Gymnasyum – Smart Reminder & Follow-Up

React + Vite frontend, Express REST API with Joi validation, PostgreSQL, Axios.

## Setup
1. Install Node.js 20+, PostgreSQL 15+. Create PostgreSQL database `gymnasyum`.
2. Execute `backend/schema.sql` using psql or pgAdmin Query Tool.
3. Copy `backend/.env.example` to `backend/.env` and set DATABASE_URL.
4. `cd backend && npm install && npm run dev`
5. In another terminal: `cd frontend && npm install && npm run dev`. Open http://localhost:5173.

## Features
- Member CRUD; schedule CRUD; attendance updates; reminder automatically created on schedule creation; priority by missed classes; daily reminders; WhatsApp draft links; manual status confirmation; cross-date history of status changes; responsive layout.
- API endpoints are prefixed `/api/v1/`: `health`, `members`, `schedules`, `schedules/:id/attendance`, `reminders`, `reminders/today`, `reminders/:id`, `reminders/:id/message`, `history`.
- Reminder state progression: scheduled → opened → sent → responded/no_response. Opening a WhatsApp link is not proof of delivery.

## Limitations and production readiness
This is a local demonstration build, **not production-ready**. There is no admin authentication, access control, rate limiting, automated integration tests, audit trail for member edits, or hosted deployment. Do not expose the backend publicly or use real member personal data until these controls are implemented. Seed data and full deployment are not included. PostgreSQL must be configured locally.
