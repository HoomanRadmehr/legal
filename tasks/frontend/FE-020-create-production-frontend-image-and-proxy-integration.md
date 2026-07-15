# FE-020: Create production frontend image and proxy integration

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-012
Depends on: FE-001, BE-031

## Goal

Build a locked, minimal production frontend image and integrate static routing with the reverse proxy.

## Allowed scope

- `docker/frontend/Dockerfile`
- `docker/nginx/`
- `compose.production.yaml`
- `frontend/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-012-testing-delivery.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create multi-stage frontend build with `npm ci`.
2. Serve build from minimal unprivileged runtime or reverse proxy static path.
3. Configure SPA fallback without intercepting `/api` or `/ws`.
4. Use only public build-time API/WS origins; no secrets.
5. Add health/static smoke check and production compose integration.

## Acceptance criteria

- [ ] Production does not run Vite dev server.
- [ ] Image contains no `.env` secret.
- [ ] SPA/API/WS routes do not conflict.
- [ ] Build is reproducible and runtime non-root where supported.

## Verification commands

```bash
cd frontend && npm ci && npm run build
docker build -f docker/frontend/Dockerfile -t legal-frontend:prod .
docker compose -f compose.yaml -f compose.production.yaml config
```

## Out of scope

- CDN/cloud deployment.

## Codex execution log

- Started: 2026-07-15 18:00 +0330
- Completed: 2026-07-15 18:02 +0330
- Files changed:
  - `docker/frontend/Dockerfile`
  - `docker/frontend/nginx.conf`
  - `tasks/frontend/FE-020-create-production-frontend-image-and-proxy-integration.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci && npm run build` (initially failed on a root-owned generated Vite cache; passed after correcting ownership and removing `node_modules/.vite`)
  - `docker build -f docker/frontend/Dockerfile -t legal-frontend:prod .`
  - `docker compose -f compose.yaml -f compose.production.yaml config`
  - `docker run --rm --entrypoint id legal-frontend:prod -u`
  - `docker run -d --rm --name legal-frontend-fe020-smoke -p 18080:8080 legal-frontend:prod` with health, SPA fallback, `/api`, and `/ws` smoke curls
  - `docker history --no-trunc legal-frontend:prod | rg -i 'DJANGO_SECRET|MINIO_SECRET|PASSWORD|legal_management_dev_password|P@|secret-key' || true`
  - `python3 scripts/check_simplicity.py frontend/src docker/frontend docker/nginx`
- Result: Tightened the production frontend Dockerfile to copy only explicit build inputs, run a locked `npm ci` build, and serve generated assets from the unprivileged nginx runtime as user `101`. Added static nginx guards so direct `/api/` and `/ws/` requests are not handled by SPA fallback. Verified the production image builds, Compose renders, runtime is non-root, health returns `ok`, unknown SPA paths return `index.html`, and direct static `/api` and `/ws` paths return `404`.
- Deviations/questions: The exact frontend build command was initially blocked by a generated `node_modules/.vite` cache owned by root from prior local runs. Only the generated cache ownership/artifact was corrected; no source behavior was changed for that cleanup. The broad simplicity scan was not used as evidence because it included the generated production bundle; the source/config scoped scan passed.
