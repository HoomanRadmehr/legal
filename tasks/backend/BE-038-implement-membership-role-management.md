# BE-038: Implement organization membership role management

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-001, BE-002, BE-008, BE-012, BE-013
Depends on: BE-008, BE-009, BE-011, BE-018, BE-019

## Goal

Allow a Legal Admin to:

1. View a permission-scoped list of users in their current organization.
2. Change an active organization's Membership role.
3. Preserve at least one active Legal Admin in every organization.
4. Record every real role change in the activity log.
5. Publish a safe transactional outbox event for every real role change.

Role management must remain explicit and must not expose a general-purpose Membership update endpoint.

## Supported roles

Use these canonical database and API values:

```text
legal_admin
legal_manager
legal_counsel
viewer
```

## Allowed scope

- `backend/apps/organizations/`
- `backend/common/services/activity.py`
- `backend/common/services/outbox.py`
- `tasks/backend/BE-038-implement-membership-role-management.md`
- `AI_USAGE.md`

## API contract

```text
GET /api/v1/memberships/
POST /api/v1/memberships/{id}/role/
```

## Business rules

1. Only an active `legal_admin` in the current organization can list memberships.
2. Only an active `legal_admin` in the current organization can change a membership role.
3. Role changes are limited to `legal_admin`, `legal_manager`, `legal_counsel`, and `viewer`.
4. Cross-organization membership identifiers return `404`.
5. At least one active Legal Admin with an active user must remain in every organization.
6. No-op role submissions return the membership without writing activity or outbox records.
7. Real role changes write a safe activity record and transactional outbox event.
8. No general-purpose Membership update endpoint is exposed.

## Acceptance criteria

- [x] Legal Admin can view active memberships in their current organization.
- [x] Non-admin roles cannot list memberships or change roles.
- [x] Legal Admin can change a current-organization membership role.
- [x] Cross-organization role changes return `404` and do not mutate data.
- [x] Demoting the last active Legal Admin returns `409`.
- [x] Real changes write redacted activity and outbox payloads.
- [x] No-op role changes do not write activity or outbox records.
- [x] General Membership detail/update endpoints remain unavailable.

## Verification commands

```bash
cd backend && python -m pytest apps/organizations/tests -q
```

## Codex execution log

- Started: 2026-07-15 10:58 +0330
- Completed: 2026-07-15 11:00 +0330
- Files changed:
  - `backend/apps/organizations/selectors.py`
  - `backend/apps/organizations/services.py`
  - `backend/apps/organizations/api/v1/openapi.py`
  - `backend/apps/organizations/api/v1/serializers.py`
  - `backend/apps/organizations/api/v1/viewsets.py`
  - `backend/apps/organizations/tests/test_role_management_api.py`
  - `backend/common/services/activity.py`
  - `backend/common/services/outbox.py`
  - `tasks/backend/BE-038-implement-membership-role-management.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python -m pytest apps/organizations/tests -q` (failed before pytest startup because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` (passed, 29 tests)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations common/services/activity.py common/services/outbox.py` (passed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations common/services/activity.py common/services/outbox.py` (initially reported `apps/organizations/services.py`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff format apps/organizations/services.py` (reformatted one scoped file)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations common/services/activity.py common/services/outbox.py` (passed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations common/services/activity.py common/services/outbox.py` (passed)
  - `python3 scripts/check_simplicity.py backend/apps/organizations backend/common/services/activity.py backend/common/services/outbox.py` (passed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with local PostgreSQL authentication warning; no changes detected)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be0268-openapi.yaml --validate` (passed with existing enum naming warnings, 0 errors)
  - `python3 scripts/validate_docs.py` (failed on unrelated existing task metadata issues outside this task)
- Result: Implemented explicit admin-only membership listing and role-change APIs with last-admin protection, no general update endpoint, and redacted activity/outbox writes for real role changes. Organization tests, lint, format, simplicity, migration drift, and OpenAPI validation passed.
- Deviations/questions: The task file name is `BE-038...`, while the task heading is `BE-038`; `scripts/validate_docs.py` only accepts integer task IDs. The original task file was malformed and ended with an unclosed role-list code fence, so acceptance criteria, verification commands, and execution log were added during completion. `python3 scripts/validate_docs.py` still fails on existing decimal task metadata issues in BE-038, BE-036, BE-037, FE-022, FE-024, and FE-023.

### Verification rerun - 2026-07-15 11:36 +0330

- Files changed:
  - `tasks/backend/BE-038-implement-membership-role-management.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python -m pytest apps/organizations/tests -q` (failed before pytest startup because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` (passed, 29 tests)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations common/services/activity.py common/services/outbox.py` (passed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations common/services/activity.py common/services/outbox.py` (passed)
  - `python3 scripts/check_simplicity.py backend/apps/organizations backend/common/services/activity.py backend/common/services/outbox.py` (passed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with local PostgreSQL authentication warning; no changes detected)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be0268-verify-openapi.yaml --validate` (passed with existing enum naming warnings, 0 errors)
  - `python3 scripts/validate_docs.py` (failed on existing decimal task heading and task metadata issues)
- Result: Re-verified BE-038 without product-code changes. Organization tests, lint, format, simplicity, migration drift, and OpenAPI validation passed.
- Deviations/questions: Documentation validation still fails because `scripts/validate_docs.py` accepts only integer task IDs and this file now has a decimal heading (`BE-038`), alongside related decimal task files and frontend task metadata issues.

### Verification rerun - 2026-07-15 19:09 +0330

- Files changed:
  - `tasks/backend/BE-038-implement-membership-role-management.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python -m pytest apps/organizations/tests -q` - failed before pytest startup because `.python-version` points to unavailable pyenv `3.12`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be038-verify-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` - passed, 29 tests
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be038-verify-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations common/services/activity.py common/services/outbox.py` - passed
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be038-verify-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations common/services/activity.py common/services/outbox.py` - passed, 27 files already formatted
  - `python3 scripts/check_simplicity.py backend/apps/organizations backend/common/services/activity.py backend/common/services/outbox.py` - passed, scanned 22 source files
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be038-verify-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` - passed with a local PostgreSQL connection warning; no changes detected
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be038-verify-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be038-verify-openapi.yaml --validate` - passed with one existing enum-name warning and 0 errors
  - `python3 scripts/validate_docs.py` - passed, 27 specs, 70 tasks, 180 Markdown files
- Result: Re-verified BE-038 without product-code changes. Admin-only membership listing, role changes, last-admin protection, no-op handling, redacted activity, and safe outbox payloads remain covered by the organization tests.
- Deviations/questions: The exact task command is still blocked by the local pyenv `3.12` shim before project code starts; the same test scope passed through the locked uv environment on `/usr/bin/python3.12`. Current documentation validation passes, superseding the earlier historical validator-blocker notes above.
