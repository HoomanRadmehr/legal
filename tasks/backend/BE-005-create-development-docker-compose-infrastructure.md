# BE-005: Create development Docker Compose infrastructure

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000, BE-013
Depends on: BE-001, BE-002

## Goal

Provide a professional local container foundation for PostgreSQL, Redis, RabbitMQ, MinIO, Mailpit, API, worker, and Beat.

## Allowed scope

- `docker/backend/Dockerfile`
- `compose.yaml`
- `compose.override.yaml`
- `infra/`
- `.dockerignore`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-000-foundation.md`, `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create a multi-stage backend Dockerfile with non-root runtime user.
2. Define common Compose services and development override.
3. Add health checks and dependency health conditions.
4. Add MinIO init service that creates a private bucket and development CORS policy.
5. Use one backend image with different commands for API/worker/Beat.
6. Ensure only one Beat service and no automatic migrations in every process.

## Acceptance criteria

- [x] `docker compose config` is valid.
- [x] Backend runtime user is non-root.
- [x] PostgreSQL/Redis/RabbitMQ/MinIO have health checks.
- [x] Private bucket is created without public read access.
- [x] No secret is baked into an image layer.

## Verification commands

```bash
docker compose config
docker build -f docker/backend/Dockerfile -t legal-backend:test .
```

## Out of scope

- Production reverse proxy and frontend image.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `docker/backend/Dockerfile`, `compose.yaml`, `compose.override.yaml`, `.dockerignore`, `infra/minio/create-private-bucket.sh`, `infra/minio/cors-dev.json`, `tasks/backend/BE-005-create-development-docker-compose-infrastructure.md`, `AI_USAGE.md`
- Commands run:
  - `docker compose config`
  - `docker build -f docker/backend/Dockerfile -t legal-backend:test .`
  - `docker image inspect legal-backend:test --format '{{.Config.User}}'`
  - `docker run --rm --entrypoint python legal-backend:test -c 'import os; print(os.getuid())'`
  - `docker image inspect legal-backend:test --format '{{json .Config.Env}}' | grep -E 'PASSWORD|SECRET|TOKEN|MINIO|DATABASE_URL|CELERY_BROKER|legal_management_dev_password' || true`
  - `docker history --no-trunc legal-backend:test | grep -E 'PASSWORD|SECRET|TOKEN|MINIO|DATABASE_URL|CELERY_BROKER|legal_management_dev_password' || true`
- Result: Passed. Compose config rendered successfully; backend image built successfully; runtime user is `app` with UID `999`; targeted image env/history scan found no application secret values.
- Deviations/questions: No unresolved questions. Compose contains development placeholder credentials as runtime environment defaults, but none are baked into the backend image layers. Migrations are provided only through the explicit `migration` profile service and are not run automatically by API, worker, or Beat.
