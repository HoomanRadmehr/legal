# BE-031: Create production Docker and Compose overlay

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-005, BE-030

## Goal

Add production-ready image/compose shape, reverse proxy routing, explicit migration job, and secure exposure.

## Allowed scope

- `docker/`
- `compose.production.yaml`
- `infra/`
- `backend/config/settings/production.py`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Finalize backend image runtime and ASGI command.
2. Add reverse proxy config for API, WebSocket upgrade, static frontend, request limits, and coarse rate limits.
3. Add production overlay with private networks and only proxy public.
4. Add one-off migration service and one Beat replica.
5. Document TLS termination assumptions and HSTS rollout.
6. Add container health checks and graceful stop.

## Acceptance criteria

- [ ] Production config exposes no database/broker/MinIO console ports.
- [ ] API/worker/Beat run non-root from one image.
- [ ] WS upgrade works in config.
- [ ] Migrations are explicit.
- [ ] Compose config and image build pass.

## Verification commands

```bash
docker compose -f compose.yaml -f compose.production.yaml config
docker build -f docker/backend/Dockerfile -t legal-backend:prod .
```

## Out of scope

- Cloud-specific deployment manifests.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
