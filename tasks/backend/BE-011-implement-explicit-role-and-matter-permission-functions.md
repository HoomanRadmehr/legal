# BE-011: Implement explicit role and matter permission functions

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-002
Depends on: BE-008, BE-003

## Goal

Create readable permission functions and one common permission base without a policy engine.

## Allowed scope

- `backend/common/permissions.py`
- `backend/apps/organizations/permissions.py`
- `backend/apps/matters/permissions.py`
- `backend/apps/organizations/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-002-organizations-permissions.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement active membership resolver.
2. Implement role checks for admin/manager/counsel/viewer.
3. Implement matter view/edit rules as functions against ownership and grants.
4. Create one domain permission class pattern that calls the functions.
5. Return not-visible behavior without data leakage.
6. Add complete role matrix tests with two organizations.

## Acceptance criteria

- [x] Every function is small and explicit.
- [x] Inactive membership denies access.
- [x] Cross-organization access is denied before object retrieval.
- [x] No bitwise permission expression or registry is used.
- [x] Role matrix matches business document.

## Verification commands

```bash
cd backend && python -m pytest apps/organizations/tests apps/matters/tests -q
```

## Out of scope

- Matter models and access grant writes.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 18:07:31 +0330
- Files changed:
  - `backend/common/permissions.py`
  - `backend/apps/organizations/permissions.py`
  - `backend/apps/organizations/tests/test_permissions.py`
  - `backend/apps/matters/__init__.py`
  - `backend/apps/matters/permissions.py`
  - `backend/apps/matters/tests/__init__.py`
  - `backend/apps/matters/tests/test_permissions.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-011-implement-explicit-role-and-matter-permission-functions.md`
- Commands run:
  - `cd backend && python -m pytest apps/organizations/tests apps/matters/tests -q` (failed before pytest: local pyenv points to missing Python 3.12)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests apps/matters/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 ruff check common/permissions.py apps/organizations/permissions.py apps/matters/permissions.py apps/organizations/tests/test_permissions.py apps/matters/tests/test_permissions.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 ruff format --check common/permissions.py apps/organizations/permissions.py apps/matters/permissions.py apps/organizations/tests/test_permissions.py apps/matters/tests/test_permissions.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with Django warning because local PostgreSQL role `legal_management` does not exist)
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: Implemented one small common permission base, explicit organization role helpers, an active membership resolver wrapper, matter visibility/edit functions, and a matter permission class that raises not-visible `404` behavior for hidden matters. Added role matrix tests with two organizations, inactive membership denial, active/revoked grants, viewer edit denial, and organization-scoped matter filtering checks.
- Deviations/questions: The allowed scope omitted `backend/apps/matters/tests/`, but the required verification command includes `apps/matters/tests`; a minimal matter test package was added so the required command has a real test target. Matter models and grant writes remain out of scope. Viewer edit grants are denied because the business acceptance criteria say viewers cannot mutate matters.
