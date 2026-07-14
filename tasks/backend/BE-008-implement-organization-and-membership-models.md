# BE-008: Implement Organization and Membership models

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-002, BE-013
Depends on: BE-007

## Goal

Create organization tenancy and one-role-per-membership data structures with constraints and factories.

## Allowed scope

- `backend/apps/organizations/`
- `backend/apps/organizations/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-002-organizations-permissions.md`, `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Organization with timezone, default language, active flag.
2. Create Membership with role/status choices and organization-user uniqueness.
3. Validate timezone and canonical role values.
4. Add selectors for active membership and admin member lists.
5. Add factories and migrations.

## Acceptance criteria

- [x] Duplicate organization/user membership is blocked by database constraint.
- [x] Inactive membership is distinguishable from inactive user.
- [x] Selectors are plain functions and organization-scoped.
- [x] No role registry or permission framework is added.

## Verification commands

```bash
cd backend && python -m pytest apps/organizations/tests -q
cd backend && python manage.py makemigrations --check --dry-run
```

## Out of scope

- JWT behavior and Matter permissions.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `backend/config/settings/base.py`
  - `backend/apps/organizations/__init__.py`
  - `backend/apps/organizations/apps.py`
  - `backend/apps/organizations/models.py`
  - `backend/apps/organizations/selectors.py`
  - `backend/apps/organizations/migrations/__init__.py`
  - `backend/apps/organizations/migrations/0001_initial.py`
  - `backend/apps/organizations/tests/__init__.py`
  - `backend/apps/organizations/tests/factories.py`
  - `backend/apps/organizations/tests/test_migration.py`
  - `backend/apps/organizations/tests/test_models.py`
  - `backend/apps/organizations/tests/test_selectors.py`
  - `tasks/backend/BE-008-implement-organization-and-membership-models.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations organizations`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations config/settings/base.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations config/settings/base.py`
  - `/usr/bin/python3 scripts/check_simplicity.py backend`
  - `/usr/bin/python3 scripts/validate_docs.py`
  - `cd backend && python -m pytest apps/organizations/tests -q` (failed before test startup because local pyenv points to uninstalled Python 3.12)
  - `cd backend && python manage.py makemigrations --check --dry-run` (failed before Django startup for the same local pyenv reason)
- Result: Passed through the locked Python 3.12 uv environment. Organizations tests passed with 12 tests; migration dry-run reported no changes; lint, format, simplicity, and docs checks passed.
- Deviations/questions: Added `apps.organizations` to `INSTALLED_APPS` in `backend/config/settings/base.py` because Django cannot load or migrate the new models otherwise. `makemigrations` emitted the existing local PostgreSQL role warning while checking migration history, then completed successfully. No unresolved questions remain.
