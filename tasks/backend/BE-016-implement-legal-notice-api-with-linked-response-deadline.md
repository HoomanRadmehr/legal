# BE-016: Implement legal notice API with linked response deadline

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-005
Depends on: BE-012, BE-015, BE-019, BE-018

## Goal

Deliver notice intake and update with one synchronized response Deadline and explicit related matters.

## Allowed scope

- `backend/apps/notices/`
- `backend/apps/deadlines/`
- `backend/apps/notices/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-005-notices.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create LegalNotice one-to-one model and relation handling.
2. Implement create service that writes Matter, Notice, linked Deadline, relations, activity, outbox atomically.
3. Implement update service that synchronizes response deadline.
4. Add selectors, serializers, ViewSet, filters, OpenAPI.
5. Test invalid dates, relations, rollback, permissions, version.

## Acceptance criteria

- [x] Notice and linked Deadline cannot diverge through API services.
- [x] Invalid response date returns 422.
- [x] Invisible/cross-org related matter is rejected safely.
- [x] Notice appears in deadline views.
- [x] No generic foreign key is used.

## Verification commands

```bash
cd backend && python -m pytest apps/notices/tests apps/deadlines/tests -q
```

## Out of scope

- Complex workflow approvals.

## Codex execution log

- Started: 2026-07-14 19:38 +0330
- Completed: 2026-07-14 19:45 +0330
- Files changed:
  - `backend/apps/notices/__init__.py`
  - `backend/apps/notices/apps.py`
  - `backend/apps/notices/models.py`
  - `backend/apps/notices/selectors.py`
  - `backend/apps/notices/services.py`
  - `backend/apps/notices/migrations/__init__.py`
  - `backend/apps/notices/migrations/0001_initial.py`
  - `backend/apps/notices/api/v1/__init__.py`
  - `backend/apps/notices/api/v1/filters.py`
  - `backend/apps/notices/api/v1/openapi.py`
  - `backend/apps/notices/api/v1/serializers.py`
  - `backend/apps/notices/api/v1/urls.py`
  - `backend/apps/notices/api/v1/viewsets.py`
  - `backend/apps/notices/tests/__init__.py`
  - `backend/apps/notices/tests/factories.py`
  - `backend/apps/notices/tests/test_api.py`
  - `backend/apps/notices/tests/test_services.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 ruff format apps/notices apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 ruff check apps/notices apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 ruff check --fix apps/notices apps/deadlines config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations notices`
  - `cd backend && python -m pytest apps/notices/tests apps/deadlines/tests -q` (failed before pytest startup because local pyenv points to uninstalled Python 3.12)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python -m pytest apps/notices/tests apps/deadlines/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py` (initially failed because generated `frontend/node_modules` Markdown was present)
  - `rm -rf frontend/node_modules && /usr/bin/python3.12 scripts/validate_docs.py`
- Result: DONE. Implemented legal notice intake/update/archive with one linked response deadline, explicit related MatterRelation rows, API/OpenAPI, and tests covering date validation, rollback, relation visibility, deadline sync, deadline view inclusion, permissions, version conflict, archive, and timeline.
- Deviations/questions: `backend/config/settings/base.py` and `backend/config/urls.py` were changed outside the listed app scope to register and publish the notices app. Removed generated ignored `frontend/node_modules` so documentation validation scans repo-owned Markdown. Local Postgres role `legal_management` is absent, so Django emitted a migration-history warning during migration commands; the commands still completed successfully.
