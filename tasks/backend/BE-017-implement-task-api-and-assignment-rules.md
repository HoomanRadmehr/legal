# BE-017: Implement task API and assignment rules

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-006
Depends on: BE-012, BE-019, BE-018

## Goal

Deliver simple matter-linked tasks with explicit assignment, filters, completion, and cancellation.

## Allowed scope

- `backend/apps/tasks/`
- `backend/apps/tasks/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Task model with explicit organization/matter/assignee/status/due/version.
2. Implement permission-scoped selectors.
3. Implement create/update/complete/cancel services and role assignment rules.
4. Add ModelSerializers, ViewSet, FilterSet, OpenAPI.
5. Add audit/outbox and tests.

## Acceptance criteria

- [x] Cross-org/inactive assignee is rejected.
- [x] Counsel cannot reassign another user where matrix denies it.
- [x] Completion/cancellation is idempotent.
- [x] Viewer is read-only.
- [x] Filters and ordering are allowlisted.

## Verification commands

```bash
cd backend && python -m pytest apps/tasks/tests -q
```

## Out of scope

- Comments, subtasks, or kanban framework.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 19:52 +0330
- Files changed: `backend/apps/tasks/`, `backend/config/settings/base.py`, `backend/config/urls.py`, `tasks/backend/BE-017-implement-task-api-and-assignment-rules.md`, `AI_USAGE.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations tasks`
  - `cd backend && python -m pytest apps/tasks/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python -m pytest apps/tasks/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 ruff check apps/tasks config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 ruff format --check apps/tasks config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be017-openapi.yaml --validate`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: DONE. Implemented the task model, migration, permission-scoped selectors, explicit mutation services, API serializers/filter/viewset/OpenAPI, and focused tests. Final task test run passed with 18 tests.
- Deviations/questions: The task allowed scope omitted Django app and URL registration, but a real model/API requires `INSTALLED_APPS` and route wiring; those two config edits were kept minimal. The literal pytest command could not start because pyenv lacks version `3.12`; the same test target passed through `/usr/bin/python3.12` using `uv`. Django migration commands warned that the local PostgreSQL role `legal_management` does not exist while checking history, but migration generation and drift check completed. OpenAPI validation had 0 errors and one drf-spectacular enum naming warning for reused `status` choice fields.
