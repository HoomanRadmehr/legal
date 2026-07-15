# BE-031: Create production Docker and Compose overlay

Status: DONE
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

- [x] Production config exposes no database/broker/MinIO console ports.
- [x] API/worker/Beat run non-root from one image.
- [x] WS upgrade works in config.
- [x] Migrations are explicit.
- [x] Compose config and image build pass.

## Verification commands

```bash
docker compose -f compose.yaml -f compose.production.yaml config
docker build -f docker/backend/Dockerfile -t legal-backend:prod .
```

## Out of scope

- Cloud-specific deployment manifests.

## Codex execution log

- Started: 2026-07-15T17:02:32+03:30
- Completed: 2026-07-15T17:02:32+03:30
- Files changed:
  - `docker/backend/Dockerfile`
  - `docker/frontend/Dockerfile`
  - `docker/frontend/nginx.conf`
  - `docker/minio-init/Dockerfile`
  - `docker/nginx/Dockerfile`
  - `docker/nginx/templates/default.conf.template`
  - `compose.production.yaml`
  - `infra/minio/create-private-bucket.sh`
  - `infra/README.md`
  - `backend/config/settings/production.py`
  - `tasks/backend/BE-031-create-production-docker-and-compose-overlay.md`
  - `AI_USAGE.md`
- Commands run:
  - `docker compose -f compose.yaml -f compose.production.yaml config` - passed.
  - `docker build -f docker/backend/Dockerfile -t legal-backend:prod .` - initially failed because `uv sync` creates a venv without `pip`; passed after switching the pinned Daphne install to `uv pip install`.
  - `docker run --rm --entrypoint id legal-backend:prod -u` - passed, returned non-root UID `999`.
  - `docker run --rm --entrypoint python legal-backend:prod -c 'import daphne; print(daphne.__version__)'` - passed, returned `4.1.2`.
  - `docker compose -f compose.yaml -f compose.production.yaml config --services` - passed, confirmed default production services exclude development `frontend` and `mailpit`.
  - `docker compose -f compose.yaml -f compose.production.yaml --profile migrations config --services` - passed, confirmed explicit one-off `migration` service is available behind the `migrations` profile.
- Result: DONE. Added a production Compose overlay with private backend/frontend networks, a public reverse proxy, static frontend runtime, production MinIO init image, explicit migration profile, one Beat service, ASGI API command, health checks, graceful stop windows, and no public PostgreSQL/Redis/RabbitMQ/MinIO console ports. Added reverse-proxy WebSocket upgrade handling, coarse IP rate limits, request size/timeouts, and query-redacting access logs. Production settings now require an HTTPS public MinIO endpoint.
- Deviations/questions: The backend lock file does not include an ASGI server and this task's allowed scope excludes dependency files, so the Docker image installs pinned `daphne==4.1.2` during the image build. The rendered Compose config in this workspace uses values from the local untracked development `.env`, including HTTP origins; `config.settings.production` intentionally rejects those at runtime until production HTTPS values are supplied.
