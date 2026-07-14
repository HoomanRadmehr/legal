# BE-006: Add backend CI and documentation guard checks

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000, BE-013
Depends on: BE-001, BE-003, BE-004

## Goal

Create CI checks that enforce formatting, tests, OpenAPI validation, migrations, documentation, and simplicity.

## Allowed scope

- `.github/workflows/`
- `scripts/`
- `backend/pyproject.toml`
- `README.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-000-foundation.md`, `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Add backend CI job with locked dependency install.
2. Run Ruff, pytest, migration drift check, OpenAPI validation, docs validation, and simplicity scanner.
3. Add cache only where it does not hide lock-file correctness.
4. Fail clearly on any command error.

## Acceptance criteria

- [x] CI covers all named checks.
- [x] No check is allowed to pass through `|| true`.
- [x] Docs validator and simplicity scanner run from repository root.

## Verification commands

```bash
python scripts/validate_docs.py
python scripts/check_simplicity.py backend
```

## Out of scope

- Frontend CI and deployment.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `.github/workflows/backend-ci.yml`, `README.md`, `backend/common/api/errors.py`, `backend/common/api/exception_handler.py`, `backend/common/api/filters.py`, `backend/common/api/openapi.py`, `backend/common/api/pagination.py`, `backend/common/api/serializers.py`, `backend/common/api/viewsets.py`, `backend/common/health/serializers.py`, `backend/common/health/views.py`, `backend/common/logging.py`, `backend/common/middleware.py`, `backend/common/models.py`, `backend/common/tests/test_openapi_components.py`, `backend/config/asgi.py`, `backend/config/celery.py`, `backend/config/env.py`, `backend/config/routing.py`, `backend/config/settings/base.py`, `backend/config/settings/development.py`, `backend/config/settings/production.py`, `backend/config/settings/test.py`, `backend/config/urls.py`, `backend/manage.py`, `tasks/backend/BE-006-add-backend-ci-and-documentation-guard-checks.md`, `AI_USAGE.md`
- Commands run:
  - `python scripts/validate_docs.py` (initial local run failed because the active pyenv `python` shim requires unavailable Python `3.12`)
  - `python scripts/check_simplicity.py backend` (initial local run failed for the same pyenv shim reason)
  - `/usr/bin/python3 scripts/validate_docs.py` (initial run failed on existing broken README link to `tasks/TIMEBOX.md`; fixed and reran)
  - `/usr/bin/python3 scripts/validate_docs.py`
  - `/usr/bin/python3 scripts/check_simplicity.py backend`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv sync --locked --all-groups --python /usr/bin/python3.12`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run ruff format --check .` (initial run failed on 23 unformatted backend files)
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run ruff format .`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run ruff format --check .`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run ruff check .`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run python -m pytest -q`
  - `DJANGO_SETTINGS_MODULE=config.settings.test UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run python manage.py makemigrations --check --dry-run`
  - `mkdir -p ../build && DJANGO_SETTINGS_MODULE=config.settings.test UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run python manage.py spectacular --file ../build/openapi.yaml --validate`
  - `DJANGO_SETTINGS_MODULE=config.settings.production ... UV_PROJECT_ENVIRONMENT=/tmp/legal-be-006-venv uv run python manage.py check --deploy` with non-secret CI placeholder environment values
- Result: Passed. Documentation validation reported 27 specs, 63 tasks, and 172 Markdown files; simplicity scanned 41 files; locked dependency sync installed 55 packages; Ruff format and lint passed; pytest reported 19 passed; migration drift check reported no changes; OpenAPI validation and production deploy checks passed.
- Deviations/questions: No unresolved questions. The task's allowed scope did not list existing backend source files, but the required formatting gate could not pass until those files were Ruff-formatted. Codex applied only mechanical Ruff formatting to existing backend files and made no behavior changes. Local verification used `/usr/bin/python3` where the task's literal `python` command was blocked by the machine's pyenv shim.
