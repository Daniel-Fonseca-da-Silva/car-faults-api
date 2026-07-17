# Car Faults API

Backend for **Car Faults** — a SaaS focused on **chronic reliability by vehicle model**: what typically fails on a given make / model / year / engine, how severe it is, typical cost and how it gets fixed.

Initial market: **Portugal** (later ES/FR). Product languages: `pt-PT` and `en-GB`.

## What we are

Structured answers to: *before you buy (or if you already own the car), what are the known chronic issues for this model, symptoms, typical cost, and community fixes?*

Example value:

| Model | Typical issues |
|-------|----------------|
| VW Polo 6N1 | Weak 1.0 engine; high consumption; gearbox problems |
| Peugeot 206 | Chronic axles |
| Renault Clio | Electrical; interior plastics |

## What we are not

We do **not** provide VIN history, odometer fraud checks, or accident records for a specific vehicle (that problem space belongs to services like carVertical / Certidão / IPO).

## Problem we solve

Known-issue information is fragmented across forums, YouTube, ADAC/TÜV reports, and Facebook groups. Buyers and used-car owners often discover chronic faults too late. We consolidate that into one place.

## Stack

| Layer | Technology |
|-------|------------|
| API | NestJS + TypeORM + PostgreSQL |
| Cache | Redis (cached lookup responses by model) |
| Auth | Google OAuth |
| Storage | Cloudflare R2 (avatars + vehicle photos) |
| Frontend | Next.js (consumes this API) |
| AI | Provider TBD — structured JSON for issues + tech specs |
| Payments | Phase 2 — Stripe (not in MVP) |

## MVP (Phase 1)

1. Lookup by make, model, year, and engine
2. Cache flow: Redis → Postgres → AI (on miss), then persist and cache
3. Response: `known_issues` + `tech_specs`
4. Google login
5. Reviews and comments on issues
6. Fixes (AI-generated and/or user-submitted)
7. Vehicle photo uploads → R2
8. No Stripe / no paywall

**Phase 2** adds freemium plans, free lookup limits, and subscriptions.

## Lookup flow

```
User (make + model + year + engine)
        │
        ▼
API lookup
        │
        ├─ Redis HIT ──────────────────────────► cached JSON
        │
        ├─ Redis MISS → Postgres HIT ─► warm Redis ► JSON
        │
        └─ Postgres MISS → AI
                │
                ▼
          Persist model + issues + fixes
          Warm Redis → JSON response
```

Authenticated users can then review issues, comment, link a model to “my car”, upload photos, and view or suggest fixes.

AI content is marked as generated, sources are stored when available, and product copy should treat results as indicative — not a substitute for a mechanic.

## Getting started

```bash
npm install
```

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

Default port: `3005` (override with `PORT`).

### Database (Docker)

The API expects a local PostgreSQL instance, provided via Docker Compose.

```bash
cp .env.example .env
docker compose up -d
docker compose ps   # postgres should be "healthy"
```

The app runs locally (outside Docker) and connects to Postgres using the `DATABASE_*` variables in `.env`.

### Useful URLs

| Resource | URL |
|----------|-----|
| Health | `GET http://localhost:3005/v1/health` |
| Swagger UI | `http://localhost:3005/docs` |
| OpenAPI JSON | `http://localhost:3005/docs-json` |

All API routes are versioned under `/v1`.

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

Global coverage (statements, branches, functions, lines) must stay at **90%+**. PRs and pushes to `main` run `npm run test:cov` in CI and fail below that threshold.

## License

Proprietary source-available license — see [LICENSE](LICENSE).

You may use and run this software. You may **not** modify it or create derivative works without prior written permission from the copyright holder.
