# BE-014: Implement contract API and date rules

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-004
Depends on: BE-012, BE-019, BE-018

## Goal

Deliver contract CRUD-with-archive using explicit date validation, filters, activity, and outbox.

## Allowed scope

- `backend/apps/contracts/`
- `backend/apps/contracts/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-004-contracts.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Contract one-to-one model and bounded key terms policy.
2. Implement selectors and create/update/archive services.
3. Validate effective/expiration/renewal ordering in named functions.
4. Add explicit ModelSerializers, ViewSet, FilterSet, permissions, URLs, OpenAPI.
5. Add role, date, version, and transaction tests.

## Acceptance criteria

- [x] Invalid date order returns 422 stable error.
- [x] Version conflict returns 409.
- [x] List filters are allowlisted and permission-scoped.
- [x] Archive preserves audit history.
- [x] No polymorphic serializer or model is used.

## Verification commands

```bash
cd backend && python -m pytest apps/contracts/tests -q
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
```

## Out of scope

- Automatic renewal workflow.

## Codex execution log

- Started: 2026-07-14 19:31 +0330
- Completed: 2026-07-14 19:31 +0330
- Files changed:
  - `backend/apps/contracts/__init__.py`
  - `backend/apps/contracts/apps.py`
  - `backend/apps/contracts/models.py`
  - `backend/apps/contracts/selectors.py`
  - `backend/apps/contracts/services.py`
  - `backend/apps/contracts/migrations/__init__.py`
  - `backend/apps/contracts/migrations/0001_initial.py`
  - `backend/apps/contracts/api/v1/__init__.py`
  - `backend/apps/contracts/api/v1/filters.py`
  - `backend/apps/contracts/api/v1/openapi.py`
  - `backend/apps/contracts/api/v1/serializers.py`
  - `backend/apps/contracts/api/v1/urls.py`
  - `backend/apps/contracts/api/v1/viewsets.py`
  - `backend/apps/contracts/tests/__init__.py`
  - `backend/apps/contracts/tests/factories.py`
  - `backend/apps/contracts/tests/test_api.py`
  - `backend/apps/contracts/tests/test_services.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations contracts`
  - `cd backend && python -m pytest apps/contracts/tests -q` (failed before test startup because local pyenv points to uninstalled Python 3.12)
  - `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` (failed before Django startup for the same local pyenv reason)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 ruff format apps/contracts config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 ruff check --fix apps/contracts config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python -m pytest apps/contracts/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 ruff check apps/contracts config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 ruff format --check apps/contracts config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: DONE. Implemented contract model/API/date rules with 16 contract tests passing, OpenAPI validation passing, and no migration drift.
- Deviations/questions: `backend/config/settings/base.py` and `backend/config/urls.py` were changed outside the listed app scope to register the contracts app and publish `/api/v1/contracts/`. Local Postgres role `legal_management` is absent, so Django emitted a migration history warning during migration commands; the commands still completed successfully.
