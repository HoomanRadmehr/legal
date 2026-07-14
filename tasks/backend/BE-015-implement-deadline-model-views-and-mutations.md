# BE-015: Implement Deadline model, views, and mutations

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-006
Depends on: BE-012, BE-019, BE-018

## Goal

Create common deadline storage and all four required permission-aware timezone views.

## Allowed scope

- `backend/apps/deadlines/`
- `backend/apps/deadlines/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Deadline model with organization, matter, assignee, due_at, status, priority, reminder flag, version.
2. Implement explicit view selectors for today/upcoming/overdue/assigned_to_me using organization timezone.
3. Implement create/update/complete/cancel services with authorization, idempotent final actions, activity/outbox.
4. Add ViewSet, ModelSerializers, FilterSet, indexes, OpenAPI.
5. Add frozen-time and role tests.

## Acceptance criteria

- [x] All four views match spec at timezone boundaries.
- [x] Completed/cancelled deadlines are excluded from open views.
- [x] Assignee must be active and same organization.
- [x] Complete/cancel are idempotent.
- [x] Query is matter-permission-scoped.

## Verification commands

```bash
cd backend && python -m pytest apps/deadlines/tests -q
```

## Out of scope

- Reminder delivery jobs and notice synchronization.

## Codex execution log

- Started: 2026-07-14 19:31 +0330
- Completed: 2026-07-14 19:38 +0330
- Files changed:
  - `backend/apps/deadlines/__init__.py`
  - `backend/apps/deadlines/apps.py`
  - `backend/apps/deadlines/models.py`
  - `backend/apps/deadlines/selectors.py`
  - `backend/apps/deadlines/services.py`
  - `backend/apps/deadlines/migrations/__init__.py`
  - `backend/apps/deadlines/migrations/0001_initial.py`
  - `backend/apps/deadlines/api/v1/__init__.py`
  - `backend/apps/deadlines/api/v1/filters.py`
  - `backend/apps/deadlines/api/v1/openapi.py`
  - `backend/apps/deadlines/api/v1/serializers.py`
  - `backend/apps/deadlines/api/v1/urls.py`
  - `backend/apps/deadlines/api/v1/viewsets.py`
  - `backend/apps/deadlines/tests/__init__.py`
  - `backend/apps/deadlines/tests/factories.py`
  - `backend/apps/deadlines/tests/test_api.py`
  - `backend/apps/deadlines/tests/test_selectors.py`
  - `backend/apps/deadlines/tests/test_services.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 ruff format apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 ruff check apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 ruff check --fix apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations deadlines`
  - `cd backend && python -m pytest apps/deadlines/tests -q` (failed before pytest startup because local pyenv points to uninstalled Python 3.12)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python -m pytest apps/deadlines/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 ruff format --check apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: DONE. Implemented deadline storage, permission-scoped views, mutation services, API/OpenAPI, and 15 deadline tests covering timezone views, final-state exclusion, assignee validation, idempotent final actions, stale versions, and permission scoping.
- Deviations/questions: `backend/config/settings/base.py` and `backend/config/urls.py` were changed outside the listed app scope to register and publish the deadlines app. Selector tests use explicit fixed `now` arguments rather than adding a freeze-time dependency. Local Postgres role `legal_management` is absent, so Django emitted a migration-history warning during migration commands; the commands still completed successfully.
