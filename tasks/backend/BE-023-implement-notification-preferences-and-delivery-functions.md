# BE-023: Implement notification preferences and delivery functions

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-009
Depends on: BE-019, BE-022, BE-008

## Goal

Create recipient-scoped notifications, user-configurable channels, and explicit delivery dispatch functions.

## Allowed scope

- `backend/apps/notifications/`
- `backend/apps/notifications/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-009-notifications-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create NotificationPreference, Notification, and NotificationDelivery models.
2. Implement own-preference list/replace service.
3. Implement recipient/delivery creation with unique dedupe key.
4. Implement explicit in_app/email/sms/push functions and `if` dispatch.
5. Mark unconfigured SMS/push as skipped with safe code.
6. Publish in-app event after notification persists.
7. Add APIs, OpenAPI, and tests.

## Acceptance criteria

- [x] Users cannot modify another user preferences.
- [x] No abstract channel class or registry exists.
- [x] Disabled/unconfigured channel status is truthful.
- [x] Duplicate delivery intent is blocked.
- [x] Provider secrets and raw responses are not stored/logged.

## Verification commands

```bash
cd backend && python -m pytest apps/notifications/tests -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Provider-specific production SDK integration unless credentials are available.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 21:45:38 +0330
- Files changed:
  - `backend/apps/notifications/__init__.py`
  - `backend/apps/notifications/apps.py`
  - `backend/apps/notifications/models.py`
  - `backend/apps/notifications/selectors.py`
  - `backend/apps/notifications/services.py`
  - `backend/apps/notifications/tasks.py`
  - `backend/apps/notifications/migrations/0001_initial.py`
  - `backend/apps/notifications/migrations/__init__.py`
  - `backend/apps/notifications/api/__init__.py`
  - `backend/apps/notifications/api/v1/__init__.py`
  - `backend/apps/notifications/api/v1/filters.py`
  - `backend/apps/notifications/api/v1/openapi.py`
  - `backend/apps/notifications/api/v1/serializers.py`
  - `backend/apps/notifications/api/v1/urls.py`
  - `backend/apps/notifications/api/v1/views.py`
  - `backend/apps/notifications/tests/__init__.py`
  - `backend/apps/notifications/tests/factories.py`
  - `backend/apps/notifications/tests/test_api.py`
  - `backend/apps/notifications/tests/test_services.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-023-implement-notification-preferences-and-delivery-functions.md`
- Commands run:
  - `cd backend && python -m pytest apps/notifications/tests -q` (failed before pytest because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be023-venv uv run --python /usr/bin/python3.12 python -m pytest apps/notifications/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be023-venv uv run --python /usr/bin/python3.12 ruff format apps/notifications config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be023-venv uv run --python /usr/bin/python3.12 ruff check apps/notifications config/settings/base.py config/urls.py`
  - `python scripts/check_simplicity.py backend` (failed before script startup because `.python-version` points to uninstalled `3.12`)
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `python3 scripts/check_simplicity.py backend`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be023-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with local PostgreSQL authentication warning)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be023-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be023-schema.yaml --validate` (passed with one enum-name warning)
  - `python3 scripts/validate_docs.py`
- Result: DONE; implemented concrete notification preferences, notifications, delivery rows, own-preference replacement/listing, recipient-scoped notification reads, read/read-all actions, explicit channel delivery functions, safe skipped statuses for disabled/unconfigured channels, unique delivery dedupe keys, in-app realtime hints, OpenAPI declarations, Celery task wrapper, and focused tests.
- Deviations/questions: The task allowed scope omitted `backend/config/settings/base.py` and `backend/config/urls.py`, but app registration and route registration are required for migrations, tests, and the published API endpoints. I made only those minimal config edits and treated them as a scoped deviation. OpenAPI validation has the existing repeated `status` enum naming warning and no schema errors.
