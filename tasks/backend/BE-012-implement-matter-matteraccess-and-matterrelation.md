# BE-012: Implement Matter, MatterAccess, and MatterRelation

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-002, BE-003
Depends on: BE-008, BE-011

## Goal

Create the concrete shared Matter boundary and explicit access/relation models with no polymorphism.

## Allowed scope

- `backend/apps/matters/`
- `backend/apps/matters/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-002-organizations-permissions.md`, `specs/backend/BE-003-cases.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Matter with explicit organization, kind, title, reference, status, priority, owner, version, archive, and creator fields.
2. Create MatterAccess and MatterRelation with explicit foreign keys and constraints.
3. Implement permission-scoped `matter_list` and `matter_get` selectors.
4. Implement grant/revoke and owner-transfer service stubs or minimal operations required by later tasks.
5. Add database indexes for organization/reference/status/owner.

## Acceptance criteria

- [x] Matter uses `CommonModel` as its only direct base.
- [x] Case/contract/notice details will compose with Matter rather than inherit.
- [x] Organization+reference is unique.
- [x] Self and cross-organization relations are rejected.
- [x] Visibility selectors pass role matrix tests.

## Verification commands

```bash
cd backend && python -m pytest apps/matters/tests -q
cd backend && python manage.py makemigrations --check --dry-run
python scripts/check_simplicity.py backend
```

## Out of scope

- Case/contract/notice detail fields.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 18:16:56 +0330
- Files changed:
  - `backend/config/settings/base.py`
  - `backend/apps/matters/apps.py`
  - `backend/apps/matters/models.py`
  - `backend/apps/matters/permissions.py`
  - `backend/apps/matters/selectors.py`
  - `backend/apps/matters/services.py`
  - `backend/apps/matters/migrations/__init__.py`
  - `backend/apps/matters/migrations/0001_initial.py`
  - `backend/apps/matters/tests/factories.py`
  - `backend/apps/matters/tests/test_models.py`
  - `backend/apps/matters/tests/test_permissions.py`
  - `backend/apps/matters/tests/test_selectors.py`
  - `backend/apps/matters/tests/test_services.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-012-implement-matter-matteraccess-and-matterrelation.md`
- Commands run:
  - `cd backend && python -m pytest apps/matters/tests -q` (failed before pytest: local pyenv points to missing Python 3.12)
  - `cd backend && python manage.py makemigrations --check --dry-run` (failed before Django startup for the same local pyenv reason)
  - `python scripts/check_simplicity.py backend` (failed before script startup for the same local pyenv reason)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations matters`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 python -m pytest apps/matters/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with Django warning because local PostgreSQL role `legal_management` does not exist)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 ruff check config/settings/base.py apps/matters apps/matters/tests`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 ruff format --check config/settings/base.py apps/matters apps/matters/tests`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: Implemented the concrete `Matter`, `MatterAccess`, and `MatterRelation` boundary models with explicit foreign keys, indexes, constraints, and initial migration; added permission-scoped `matter_list`/`matter_get` selectors; added minimal grant/revoke/owner-transfer services; and expanded tests for inheritance, uniqueness, same-organization validation, relation validation, visibility selectors, and service tenant checks.
- Deviations/questions: Registering `apps.matters` in `backend/config/settings/base.py` was required for Django to discover models and migrations, although the allowed scope listed only `backend/apps/matters/`. Grant/revoke and owner-transfer services intentionally omit activity/outbox writes because audit models are not in this task scope.
