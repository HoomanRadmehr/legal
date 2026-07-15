# BE-027: Implement offboarding preview and atomic execute

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-011
Depends on: BE-008, BE-012, BE-015, BE-017, BE-018, BE-019, BE-023

## Goal

Provide Admin-only preview and idempotent atomic transfer of owned/assigned work.

## Allowed scope

- `backend/apps/offboarding/`
- `backend/apps/matters/services.py`
- `backend/apps/offboarding/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-011-offboarding.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create OffboardingRun model.
2. Implement preview selector with safe affected records and fingerprint.
3. Implement execute service with role check, same-org active replacement, lock order, idempotency, stale preview check.
4. Reassign matters/open tasks/open deadlines, revoke grants, deactivate membership, activity/outbox in one transaction.
5. Add APIs, OpenAPI, and rollback tests.

## Acceptance criteria

- [x] Preview has no mutations.
- [x] Only Admin can call endpoints.
- [x] Any stage failure rolls back all data.
- [x] No active matter remains owned by departed member.
- [x] Matching replay is safe; conflicting/stale request returns 409.

## Verification commands

```bash
cd backend && python -m pytest apps/offboarding/tests -q
```

## Out of scope

- HR integrations or multi-stage approval.

## Codex execution log

- Started: 2026-07-15 11:45 +0330
- Completed: 2026-07-15 11:45 +0330
- Files changed:
  - `backend/apps/offboarding/__init__.py`
  - `backend/apps/offboarding/apps.py`
  - `backend/apps/offboarding/models.py`
  - `backend/apps/offboarding/migrations/__init__.py`
  - `backend/apps/offboarding/migrations/0001_initial.py`
  - `backend/apps/offboarding/selectors.py`
  - `backend/apps/offboarding/services.py`
  - `backend/apps/offboarding/api/__init__.py`
  - `backend/apps/offboarding/api/v1/__init__.py`
  - `backend/apps/offboarding/api/v1/openapi.py`
  - `backend/apps/offboarding/api/v1/serializers.py`
  - `backend/apps/offboarding/api/v1/urls.py`
  - `backend/apps/offboarding/api/v1/views.py`
  - `backend/apps/offboarding/tests/__init__.py`
  - `backend/apps/offboarding/tests/test_api.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
  - `tasks/backend/BE-027-implement-offboarding-preview-and-atomic-execute.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python -m py_compile apps/offboarding/services.py apps/offboarding/api/v1/views.py apps/offboarding/tests/test_api.py`
  - `python3 scripts/check_simplicity.py backend/apps/offboarding backend/apps/matters/services.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python -m pytest apps/offboarding/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 ruff check apps/offboarding config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 ruff format --check apps/offboarding config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `cd backend && python -m pytest apps/offboarding/tests -q` (failed before pytest startup because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be027-openapi.yaml --validate`
  - `python3 scripts/validate_docs.py`
- Result: Implemented Admin-only offboarding preview, idempotent atomic execute, run retrieval, OffboardingRun persistence, and tests. Focused offboarding tests passed with 11 tests; lint, format, simplicity, migration drift, and OpenAPI validation passed.
- Deviations/questions: The task allowed scope omitted `backend/config/settings/base.py` and `backend/config/urls.py`, but app installation and URL registration were necessary for the required public API and OpenAPI validation. `python3 scripts/validate_docs.py` still fails on existing decimal task heading/metadata issues outside BE-027. The exact verification command fails before pytest startup because pyenv points to uninstalled `3.12`; the same tests pass through `/usr/bin/python3.12` with `uv`.
