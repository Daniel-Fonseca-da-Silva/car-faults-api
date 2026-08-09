# Car Faults API

Backend for **Car Faults** — a SaaS focused on **chronic reliability by vehicle model**: what typically fails on a given make / model / year / engine, how severe it is, typical cost and how it gets fixed.

Initial market: **Portugal** (later ES/FR). Product languages: `pt-PT`, `en-GB` and `es-ES`.

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
| Auth | Google OAuth (JWT cookie); avatars are the Google account picture URL, no avatar upload endpoint |
| Storage | Cloudflare R2 — `POST /v1/storage/comment-images` (JWT, any signed-in user) and `POST /v1/storage/vehicle-images` (JWT + admin only) |
| Frontend | Next.js (consumes this API) |
| AI | [`car-faults-ai-api`](../car-faults-ai-api) sidecar — see [AI provider](#ai-provider) below |

## MVP (Phase 1)

1. Lookup by make, model, year, and engine
2. Cache flow: Redis → Postgres → AI (on miss), then persist and cache
3. Response: `known_issues` + `tech_specs`
4. Google login
5. Reviews and comments on issues
6. Fixes (AI-generated and/or user-submitted)
7. Vehicle photo uploads → R2

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

## AI provider

This API never calls an AI vendor directly — lookups and translations are delegated to the [`car-faults-ai-api`](../car-faults-ai-api) Python sidecar over HTTP.

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | `stub` (canned responses, default outside production) or `http` (calls the sidecar) |
| `AI_API_URL` | Sidecar lookup endpoint, e.g. `http://localhost:8000/lookup` |
| `AI_TRANSLATE_URL` | Sidecar translate endpoint, e.g. `http://localhost:8000/translate` |
| `AI_API_KEY` | Optional bearer token sent to the sidecar |

**In production (`NODE_ENV=production`), `AI_PROVIDER` must be `http`** — the app refuses to boot with the stub provider outside local/test environments, so lookups can never silently return fake AI content in prod. See `src/ai/ai-lookup-provider.factory.ts` and `src/ai/ai-translate-provider.factory.ts`.

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

Port and CORS origins come from `PORT` and `CORS_ORIGINS` in `.env` (required).

### Database & cache (Docker)

`docker-compose.yml` provisions the two stateful dependencies the API needs locally: PostgreSQL and Redis.

```bash
cp .env.example .env
docker compose up -d
docker compose ps   # postgres and redis should be "healthy"
```

The app runs locally (outside Docker) and connects to Postgres and Redis using the `DATABASE_*` / `REDIS_*` variables in `.env`.

### Storage (Cloudflare R2)

Both endpoints share the same `R2_*` bucket configuration; `R2_PUBLIC_BASE_URL` is also the value returned `url`s must resolve under.

- `POST /v1/storage/comment-images` — JWT, any signed-in user, multipart, `image/jpeg|png|webp`, max 5 MB.
- `POST /v1/storage/vehicle-images` — JWT + admin only, same constraints; used by the admin panel to set a vehicle model's catalog photo.

There is no avatar upload endpoint — user avatars are the Google account picture URL returned by OAuth.

### Useful URLs

The API listens on `PORT` from `.env` (the web app's `.env.example` defaults `NEXT_PUBLIC_API_URL` to `http://localhost:3001`).

| Resource | URL |
|----------|-----|
| Health | `GET http://localhost:$PORT/v1/health` |
| Swagger UI | `http://localhost:$PORT/docs` |
| OpenAPI JSON | `http://localhost:$PORT/docs-json` |

All API routes are versioned under `/v1`.

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage (prints a Coverage summary at the end)
npm run test:coverage
```

Global coverage (statements, branches, functions, lines) must stay at **90%+**. `npm run test:cov` is a legacy alias for `npm run test:coverage`. PRs and pushes to `main` run `npm run test:cov` in CI and fail below that threshold.

## License

Proprietary — All Rights Reserved (Daniel Fonseca da Silva). See [LICENSE](LICENSE).
Use and run allowed; modification and derivative works require written permission.

You may use and run this software. You may **not** modify it or create derivative works without prior written permission from the copyright holder.
