# FE-020: Create production frontend image and proxy integration

Status: TODO
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

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
