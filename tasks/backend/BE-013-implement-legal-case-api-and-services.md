# BE-013: Implement legal case API and services

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-003
Depends on: BE-012, BE-019, BE-018

## Goal

Deliver permission-scoped case create/list/retrieve/update/archive with parties, activity, and outbox.

## Allowed scope

- `backend/apps/cases/`
- `backend/apps/matters/`
- `backend/apps/cases/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-003-cases.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create LegalCase one-to-one and CaseParty models.
2. Implement case selectors with select/prefetch optimization and visibility scope.
3. Implement create/update/archive services with transactions and expected version.
4. Use explicit ModelSerializers and CommonModelViewSet actions.
5. Add filters/order/search allowlists.
6. Add domain OpenAPI and tests.

## Acceptance criteria

- [x] Create writes Matter/detail/parties/activity/outbox atomically.
- [x] Case API ID equals Matter UUID.
- [x] Stale update returns 409.
- [x] Archive does not hard-delete.
- [x] Viewer and cross-org users cannot mutate or infer hidden records.

## Verification commands

```bash
cd backend && python -m pytest apps/cases/tests -q
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
```

## Out of scope

- Linked tasks/deadlines/documents UI or generic nested writer.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 19:24:23 +0330
- Files changed:
  - `backend/apps/cases/__init__.py`
  - `backend/apps/cases/apps.py`
  - `backend/apps/cases/models.py`
  - `backend/apps/cases/selectors.py`
  - `backend/apps/cases/services.py`
  - `backend/apps/cases/api/v1/__init__.py`
  - `backend/apps/cases/api/v1/filters.py`
  - `backend/apps/cases/api/v1/openapi.py`
  - `backend/apps/cases/api/v1/serializers.py`
  - `backend/apps/cases/api/v1/urls.py`
  - `backend/apps/cases/api/v1/viewsets.py`
  - `backend/apps/cases/migrations/__init__.py`
  - `backend/apps/cases/migrations/0001_initial.py`
  - `backend/apps/cases/tests/__init__.py`
  - `backend/apps/cases/tests/factories.py`
  - `backend/apps/cases/tests/test_api.py`
  - `backend/apps/cases/tests/test_services.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-013-implement-legal-case-api-and-services.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations cases`
  - `cd backend && python -m pytest apps/cases/tests -q` (failed before pytest: local pyenv points to uninstalled Python 3.12)
  - `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` (failed before Django startup for the same local pyenv reason)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python -m pytest apps/cases/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with Django warning because local PostgreSQL role `legal_management` does not exist)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 ruff check apps/cases config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 ruff format --check apps/cases config/settings/base.py config/urls.py`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: DONE; implemented explicit legal case models, selectors, services, API, OpenAPI declarations, filters, migration, and tests. Verified with `12 passed` and a warning-free OpenAPI schema generation.
- Deviations/questions: Added `backend/config/settings/base.py` and `backend/config/urls.py` wiring so Django can discover and expose `apps.cases`, although those files were not named in the allowed scope. No unresolved questions.
