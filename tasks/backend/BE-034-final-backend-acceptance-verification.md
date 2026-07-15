# BE-034: Final backend acceptance verification

Status: BLOCKED
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-030, BE-031, BE-032, BE-033

## Goal

Run the complete backend acceptance gate and leave a reproducible result record.

## Allowed scope

- `backend/`
- `build/`
- `tasks/backend/BE-034-final-backend-acceptance.md`
- `AI_USAGE.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Run docs and simplicity checks.
2. Run full backend lint/test/migration/OpenAPI/deploy checks.
3. Build development and production images.
4. Start integration services and run smoke flow where feasible.
5. Record exact results and unresolved limitations.
6. Do not start frontend fixes in this task.

## Acceptance criteria

- [x] Every required command passes or a real blocking failure is documented without claiming completion.
- [x] No pending migration or invalid schema.
- [x] Production settings deploy check passes with safe test values.
- [x] Task log contains exact evidence.

## Verification commands

```bash
python scripts/validate_docs.py
python scripts/check_simplicity.py backend
cd backend && python -m ruff check .
cd backend && python -m pytest -q
cd backend && python manage.py makemigrations --check --dry-run
cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate
docker compose config
```

## Out of scope

- New feature implementation.

## Codex execution log

- Started: 2026-07-15 17:39 +0330
- Completed: 2026-07-15 17:39 +0330
- Files changed:
  - `tasks/backend/BE-034-final-backend-acceptance-verification.md`
  - `AI_USAGE.md`
- Commands run:
  - `python scripts/validate_docs.py` - failed before script startup: pyenv could not find the repository `.python-version` value `3.12`.
  - `python scripts/check_simplicity.py backend` - failed before script startup for the same pyenv `3.12` issue.
  - `cd backend && python -m ruff check .` - failed before Ruff startup for the same pyenv `3.12` issue.
  - `cd backend && python -m pytest -q` - failed before pytest startup for the same pyenv `3.12` issue.
  - `cd backend && python manage.py makemigrations --check --dry-run` - failed before Django startup for the same pyenv `3.12` issue.
  - `cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate` - failed before Django startup for the same pyenv `3.12` issue.
  - `docker compose config` - passed.
  - `python3 scripts/validate_docs.py` - failed on existing decimal task ID headings: `BE-038`, `BE-036`, `BE-037`, `FE-022`, `FE-023`, and `FE-024`.
  - `python3 scripts/check_simplicity.py backend` - passed; scanned 270 source files.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be034-venv uv run --python /usr/bin/python3.12 python -m ruff check .` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be034-venv uv run --python /usr/bin/python3.12 python -m pytest -q` - passed; 30 tests.
  - `cd backend && DJANGO_SETTINGS_MODULE=config.settings.test UV_PROJECT_ENVIRONMENT=/tmp/legal-be034-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` - passed; no changes detected.
  - `cd backend && DJANGO_SETTINGS_MODULE=config.settings.test UV_PROJECT_ENVIRONMENT=/tmp/legal-be034-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file ../build/openapi.yaml --validate` - passed.
  - `cd backend && DJANGO_SETTINGS_MODULE=config.settings.production ... UV_PROJECT_ENVIRONMENT=/tmp/legal-be034-venv uv run --python /usr/bin/python3.12 python manage.py check --deploy` - passed with safe local test values.
  - `docker compose build api` - passed; built `legal-backend:dev`.
  - `docker compose -f compose.yaml -f compose.production.yaml build api frontend-static reverse-proxy minio-init` - passed; built `legal-backend:prod`, `legal-frontend:prod`, `legal-reverse-proxy:prod`, and `legal-minio-init:prod`; frontend build emitted a Vite chunk-size warning.
  - `docker compose up -d postgres redis rabbitmq minio minio-init api worker beat` - passed; local integration services started.
  - `docker compose ps api worker beat postgres redis rabbitmq minio minio-init` - passed; API, PostgreSQL, Redis, RabbitMQ, and MinIO were healthy; worker and Beat were running.
  - `curl -fsS http://127.0.0.1:8000/health/live/` - passed with `{"status":"ok"}`.
  - `curl -fsS http://127.0.0.1:8000/health/ready/` - passed with database/cache readiness `ok`.
  - `docker compose exec -T api python manage.py seed_demo` - passed; seeded 2 organizations and 8 memberships.
  - CSRF/login/me/WebSocket-ticket smoke flow against `http://127.0.0.1:8000/api/v1/` - passed; login returned 200 for `demo-primary-admin`, refresh cookie was set, bearer `/me` returned `legal_admin`, WebSocket ticket endpoint returned 200, and the ticket value was redacted from evidence.
  - `curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:9000/legal-documents` - returned 403, confirming the MinIO bucket is not anonymously readable.
  - `docker run --rm --entrypoint id legal-backend:prod` - passed; `uid=999(app)`.
  - `docker run --rm --entrypoint id legal-frontend:prod` - passed; `uid=101(nginx)`.
  - `docker image inspect legal-backend:prod legal-frontend:prod legal-reverse-proxy:prod legal-minio-init:prod --format '{{.RepoTags}} User={{.Config.User}}'` - showed non-root users for backend, frontend, and reverse-proxy, but an empty configured user for `legal-minio-init:prod`.
  - `docker run --rm --entrypoint id legal-minio-init:prod` - failed acceptance expectations: the image runs as `uid=0(root)`.
  - `docker compose -f compose.yaml -f compose.production.yaml config` with safe local test values - passed and rendered 464 lines.
  - `git ls-files | rg '(^|/)\\.env$|(^|/)\\.env\\.' || true` - returned only `.env.example`.
- Result: BLOCKED. The backend implementation can lint, test, generate OpenAPI, pass migration drift checks, pass production deploy checks, build images, start the local stack, and complete the smoke flow when run with an available Python interpreter. Final acceptance cannot be marked done because the exact required `python` commands are blocked by the repository pyenv setting, documentation validation fails on existing decimal task IDs, and the production `legal-minio-init:prod` image runs as root.
- Deviations/questions:
  - The task allowed scope lists `tasks/backend/BE-034-final-backend-acceptance.md`, but the assigned and existing task file is `tasks/backend/BE-034-final-backend-acceptance-verification.md`; this log updates the assigned file.
  - The `legal-minio-init:prod` non-root issue belongs to BE-031 production Docker scope and was not patched in this verification-only task.
  - The decimal task ID documentation failures are outside BE-034 backend acceptance implementation scope and were not silently rewritten.
