# BE-007: Implement custom User model and initial migration

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-001, BE-013
Depends on: BE-002

## Goal

Create the custom UUID User before other domain migrations, using single inheritance from `AbstractUser`.

## Allowed scope

- `backend/apps/accounts/`
- `backend/config/settings/base.py`
- `backend/apps/accounts/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-001-authentication.md`, `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create accounts app and custom User inheriting only `AbstractUser`.
2. Use UUID primary key and preferred language field.
3. Configure `AUTH_USER_MODEL` before initial migration.
4. Register a safe admin view without exposing secret fields.
5. Add factory and migration tests.

## Acceptance criteria

- [x] User has exactly one direct base.
- [x] UUID is the primary key.
- [x] Preferred language uses canonical choices.
- [x] Initial migration is stable and tests pass.

## Verification commands

```bash
cd backend && python manage.py makemigrations --check --dry-run
cd backend && python -m pytest apps/accounts/tests -q
```

## Out of scope

- JWT endpoints, organization models, or custom password cryptography.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `backend/config/settings/base.py`, `backend/apps/accounts/__init__.py`, `backend/apps/accounts/apps.py`, `backend/apps/accounts/models.py`, `backend/apps/accounts/admin.py`, `backend/apps/accounts/migrations/__init__.py`, `backend/apps/accounts/migrations/0001_initial.py`, `backend/apps/accounts/tests/__init__.py`, `backend/apps/accounts/tests/factories.py`, `backend/apps/accounts/tests/test_user_model.py`, `backend/apps/accounts/tests/test_user_migration.py`, `tasks/backend/BE-007-implement-custom-user-model-and-initial-migration.md`, `AI_USAGE.md`
- Commands run:
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-007-venv uv sync --locked --all-groups --python /usr/bin/python3.12`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-007-venv uv run python manage.py makemigrations accounts` (succeeded; local development PostgreSQL role was absent, so Django warned while checking migration history)
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-007-venv uv run ruff format .`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-007-venv uv run ruff check .` (initial run failed on generated migration import ordering and long generated strings; fixed and reran)
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-007-venv uv run python -m pytest apps/accounts/tests -q` (initial run failed because migration tests needed database access; fixed and reran)
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-007-venv uv run python manage.py makemigrations --check --dry-run`
  - `cd backend && python manage.py makemigrations --check --dry-run` (failed before Django startup because the local pyenv `python` shim requires unavailable Python `3.12`)
  - `cd backend && python -m pytest apps/accounts/tests -q` (failed for the same pyenv shim reason)
  - `cd backend && /tmp/legal-be-007-venv/bin/python manage.py makemigrations --check --dry-run`
  - `cd backend && /tmp/legal-be-007-venv/bin/python -m pytest apps/accounts/tests -q`
  - `cd backend && /tmp/legal-be-007-venv/bin/python -m pytest common/tests apps/accounts/tests tests -q`
  - `cd backend && /tmp/legal-be-007-venv/bin/python -m ruff check .`
  - `cd backend && /tmp/legal-be-007-venv/bin/python -m ruff format --check .`
  - `/usr/bin/python3 scripts/check_simplicity.py backend`
- Result: Passed. The custom user model inherits only `AbstractUser`, has a UUID primary key and canonical `en`/`fa` preferred-language choices, is configured as `accounts.User`, and has a stable initial migration. Accounts tests reported `7 passed`; combined backend tests reported `33 passed`; Ruff, formatter check, migration drift check, and simplicity check passed.
- Deviations/questions: No unresolved questions. The task's literal `python` verification commands could not run in this local shell because pyenv points `python` at an unavailable `3.12`; the same command bodies passed using the locked temporary virtualenv Python. `makemigrations` emitted a warning about the absent local development PostgreSQL role while still reporting no model changes.
