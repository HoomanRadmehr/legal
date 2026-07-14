# BE-019: Implement ActivityLog and transactional outbox

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-008
Depends on: BE-012

## Goal

Create append-only activity and durable outbox records plus explicit service functions.

## Allowed scope

- `backend/apps/activity/`
- `backend/common/services/`
- `backend/apps/activity/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-008-activity-outbox.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create ActivityLog and OutboxEvent models with safe fields and indexes.
2. Implement explicit action constants and redaction allowlist.
3. Implement `record_activity` and `create_outbox_event` functions.
4. Implement idempotent Celery outbox dispatcher with bounded retry.
5. Add rollback, duplicate dispatch, redaction, and append-only tests.

## Acceptance criteria

- [x] No signal or event registry is used.
- [x] Business rollback also removes activity/outbox.
- [x] Activity cannot be mutated through API.
- [x] Payloads contain identifiers and safe fields only.
- [x] Duplicate dispatcher execution does not duplicate effects.

## Verification commands

```bash
cd backend && python -m pytest apps/activity/tests -q
```

## Out of scope

- Notification recipient logic and activity API.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 18:23:11 +0330
- Files changed:
  - `backend/config/settings/base.py`
  - `backend/apps/activity/__init__.py`
  - `backend/apps/activity/apps.py`
  - `backend/apps/activity/models.py`
  - `backend/apps/activity/tasks.py`
  - `backend/apps/activity/migrations/__init__.py`
  - `backend/apps/activity/migrations/0001_initial.py`
  - `backend/apps/activity/tests/__init__.py`
  - `backend/apps/activity/tests/factories.py`
  - `backend/apps/activity/tests/test_activity_services.py`
  - `backend/apps/activity/tests/test_outbox_dispatcher.py`
  - `backend/common/services/__init__.py`
  - `backend/common/services/activity.py`
  - `backend/common/services/outbox.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-019-implement-activitylog-and-transactional-outbox.md`
- Commands run:
  - `cd backend && python -m pytest apps/activity/tests -q` (failed before pytest: local pyenv points to missing Python 3.12)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations activity`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 python -m pytest apps/activity/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with Django warning because local PostgreSQL role `legal_management` does not exist)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 ruff check config/settings/base.py apps/activity common/services`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 ruff format --check config/settings/base.py apps/activity common/services`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: Implemented append-only `ActivityLog`, durable `OutboxEvent`, explicit activity action constants, safe redaction allowlists, `record_activity`, `create_outbox_event`, bounded outbox dispatch helpers, and Celery task wrappers that pass IDs only. Added tests for rollback, redaction, append-only activity behavior, duplicate dispatch, safe retry error codes, and bounded retry.
- Deviations/questions: Registering `apps.activity` in `backend/config/settings/base.py` was required for Django to discover models and migrations, although the allowed scope did not list settings. Activity API and notification recipient logic remain out of scope.
