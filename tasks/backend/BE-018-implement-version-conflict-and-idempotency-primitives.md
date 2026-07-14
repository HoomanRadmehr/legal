# BE-018: Implement version conflict and idempotency primitives

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-003, BE-004, BE-006, BE-008
Depends on: BE-012, BE-019

## Goal

Provide small explicit helpers for expected-version writes and critical endpoint idempotency.

## Allowed scope

- `backend/common/services/`
- `backend/apps/activity/models.py`
- `backend/apps/activity/services.py`
- `backend/common/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-003-cases.md`, `specs/backend/BE-004-contracts.md`, `specs/backend/BE-006-deadlines-tasks.md`, `specs/backend/BE-008-activity-outbox.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create `require_version` and atomic version increment helpers without decorators that hide writes.
2. Create IdempotencyRecord with hashed key, scope, request hash, safe bounded response.
3. Implement begin/complete helpers or explicit service functions.
4. Return 409 for stale version and conflicting key reuse.
5. Add concurrency/replay tests.

## Acceptance criteria

- [x] Helpers remain plain functions within size limits.
- [x] Same key+request returns prior result; same key+different request returns 409.
- [x] Keys are not stored in plaintext if avoidable.
- [x] No generic command framework is added.

## Verification commands

```bash
cd backend && python -m pytest common/tests apps/activity/tests -q
```

## Out of scope

- Applying idempotency to every endpoint.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 18:54:58 +0330
- Files changed:
  - `backend/apps/activity/models.py`
  - `backend/apps/activity/migrations/0002_idempotencyrecord.py`
  - `backend/common/services/idempotency.py`
  - `backend/common/services/versioning.py`
  - `backend/common/tests/test_idempotency.py`
  - `backend/common/tests/test_versioning.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-018-implement-version-conflict-and-idempotency-primitives.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations activity`
  - `cd backend && python -m pytest common/tests apps/activity/tests -q` (failed before pytest: local pyenv points to uninstalled Python 3.12)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 python -m pytest common/tests apps/activity/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with Django warning because local PostgreSQL role `legal_management` does not exist)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 ruff check common/services/idempotency.py common/services/versioning.py common/tests/test_idempotency.py common/tests/test_versioning.py apps/activity/models.py apps/activity/migrations/0002_idempotencyrecord.py` (initially fixed import ordering, then passed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 ruff format --check common/services/idempotency.py common/services/versioning.py common/tests/test_idempotency.py common/tests/test_versioning.py apps/activity/models.py apps/activity/migrations/0002_idempotencyrecord.py`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
- Result: DONE; version conflict and idempotency primitives implemented and verified with `39 passed`.
- Deviations/questions: Added `backend/apps/activity/migrations/0002_idempotencyrecord.py` even though migrations were not named in the allowed scope because the required `IdempotencyRecord` model needs a database migration. No unresolved questions.
- Re-verified: 2026-07-14 19:08:34 +0330; no BE-018 code changes were needed. The literal verification command still fails before pytest because local pyenv points to uninstalled Python 3.12; the same test target passed through `/usr/bin/python3.12` with `39 passed`.
