# Legal Management Frontend

This is the React, TypeScript, and Vite frontend for the Legal Management Module. It talks to the versioned backend API under `/api/v1/`, uses one authenticated user WebSocket stream for status hints, and keeps domain screens explicit rather than generated.

## Prerequisites

- Node.js 22.
- npm from the locked `package-lock.json`.
- A running backend API for local development.
- Optional: Docker and Docker Compose for the production static image and reverse-proxy path.

Install dependencies with the lock file:

```bash
cd frontend
npm ci
```

If `npm ci` reports a permission error under `node_modules/.vite`, remove that generated cache after fixing its ownership. The cache is not source and is recreated by Vite.

## Environment

The frontend reads only public Vite build/runtime values:

| Variable | Development default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend REST API origin and prefix. |
| `VITE_WS_BASE_URL` | `ws://localhost:8000/ws/v1` | WebSocket origin and prefix when not using same-origin proxying. |
| `VITE_DEFAULT_LOCALE` | `en` | Initial locale before user preference/session data applies. |

Do not put secrets in Vite variables. Values prefixed with `VITE_` are bundled into browser assets. Access tokens stay in memory, and the refresh token is an HttpOnly backend cookie.

## Local Development

Run the backend first, then start Vite:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

The development Compose service runs the same command with a bind mount:

```bash
docker compose up frontend api postgres redis rabbitmq minio minio-init
```

Development uses the Vite dev server. Production does not.

## Quality Commands

Run these from the repository root unless noted:

```bash
python scripts/validate_docs.py
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm test -- --run
cd frontend && npm run build
python scripts/check_simplicity.py frontend
```

The final command should be run against source, not generated bundles. If `frontend/dist/` exists from `npm run build`, remove that generated directory before running the simplicity check.

## OpenAPI Types

Generate TypeScript types from the backend OpenAPI file:

```bash
cd frontend
npm run generate:api-types -- ../build/openapi.yaml src/api/generated/schema.ts
```

Generated schema types are compile-time support only. Runtime API calls remain explicit handwritten domain functions in `src/features/*/api.ts`; do not introduce a generic runtime SDK.

## Authentication Model

- Login, refresh, and logout call the backend auth endpoints with CSRF protection.
- The access token is stored only in memory.
- The refresh token is an HttpOnly cookie and is never read by JavaScript.
- Session restore calls the refresh endpoint once on app load.
- Parallel `401` replays share a single refresh attempt to avoid retry storms.
- Frontend role checks hide or disable controls for user experience only; backend authorization is authoritative.

## Realtime and Upload Recovery

The frontend requests a one-time WebSocket ticket over authenticated HTTP and connects to:

```text
/ws/v1/events/?ticket=<one-time-ticket>
```

The stream is a hint channel. REST queries remain authoritative, and reconnects invalidate affected TanStack Query keys. Document uploads transfer bytes directly to private object storage through short-lived presigned instructions, then complete through the backend. If realtime is disconnected, active upload status polling continues.

Never log or persist WebSocket tickets, access tokens, refresh cookies, presigned upload URLs, or presigned download URLs.

## Localization and Dates

- English and Persian are supported.
- Persian switches document direction to RTL.
- Technical identifiers and localized date inputs stay direction-isolated where needed.
- API payloads keep canonical enum values and Gregorian ISO dates/timestamps.
- The UI converts Persian Jalali date input/display at the browser boundary.

## Production Image

Build the static frontend image from the repository root:

```bash
docker build -f docker/frontend/Dockerfile -t legal-frontend:prod .
```

The image uses a Node builder with `npm ci`, then serves `dist/` from `nginxinc/nginx-unprivileged` as user `101`. It does not run Vite and does not copy `.env` files. Direct `/api/` and `/ws/` requests to the static container return `404`; the production reverse proxy routes those paths to the backend.

Render the production Compose configuration:

```bash
docker compose -f compose.yaml -f compose.production.yaml config
```

Production Compose uses `frontend-static` behind `reverse-proxy`, with `api`, `worker`, `beat`, PostgreSQL, Redis, RabbitMQ, and MinIO on private networks.

## Known Limitations

- This README documents local and Compose delivery, not CDN/cloud deployment.
- Formal accessibility certification is out of scope; focused React Testing Library coverage verifies critical keyboard labels, non-color status text, RTL behavior, and security-sensitive flows.
- Vite currently reports a large JavaScript chunk warning during production build. The build still succeeds; future route-level code splitting can reduce the bundle.
