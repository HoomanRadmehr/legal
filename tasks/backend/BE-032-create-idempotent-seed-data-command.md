# BE-032: Create idempotent seed data command

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-013, BE-014, BE-016, BE-015, BE-017, BE-023

## Goal

Create safe demonstration data for every role, domain, required deadline view, and organization isolation.

## Allowed scope

- `backend/apps/*/management/commands/`
- `backend/tests/test_seed.py`
- `backend/README.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement one idempotent seed command using services or carefully scoped creation helpers.
2. Create two organizations and all four roles.
3. Create visible/hidden matters, contracts, notices, deadlines for today/upcoming/overdue, tasks, preferences, and activity.
4. Use only synthetic names/content and documented demo passwords.
5. Test running command twice.

## Acceptance criteria

- [x] Second run does not duplicate records.
- [x] Seed demonstrates cross-organization isolation and every required screen.
- [x] No real personal/legal data is present.
- [x] Credentials are clearly development-only.

## Verification commands

```bash
cd backend && python manage.py seed_demo
cd backend && python manage.py seed_demo
cd backend && python -m pytest tests/test_seed.py -q
```

## Out of scope

- Large performance dataset.

## Codex execution log

- Started: 2026-07-15 16:50 +0330
- Completed: 2026-07-15 17:26 +0330
- Files changed:
  - `backend/apps/organizations/management/commands/__init__.py`
  - `backend/apps/organizations/management/commands/seed_demo.py`
  - `backend/apps/organizations/management/commands/_seed_demo_data.py`
  - `backend/tests/test_seed.py`
  - `backend/README.md`
  - `tasks/backend/BE-032-create-idempotent-seed-data-command.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python manage.py seed_demo` (failed twice before Django startup because repository pyenv `3.12` is not installed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py seed_demo` (failed with local PostgreSQL password mismatch)
  - `cd backend && DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management REDIS_URL=redis://127.0.0.1:6379/0 CHANNEL_LAYER_REDIS_URL=redis://127.0.0.1:6379/1 CELERY_BROKER_URL=amqp://legal_management:legal_management_dev_password@127.0.0.1:5672// UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py seed_demo` (failed before local Compose DB migrations were current)
  - `cd backend && DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management REDIS_URL=redis://127.0.0.1:6379/0 CHANNEL_LAYER_REDIS_URL=redis://127.0.0.1:6379/1 CELERY_BROKER_URL=amqp://legal_management:legal_management_dev_password@127.0.0.1:5672// UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py migrate --noinput` (passed)
  - `cd backend && DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management REDIS_URL=redis://127.0.0.1:6379/0 CHANNEL_LAYER_REDIS_URL=redis://127.0.0.1:6379/1 CELERY_BROKER_URL=amqp://legal_management:legal_management_dev_password@127.0.0.1:5672// UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py seed_demo` (passed twice)
  - `cd backend && python -m pytest tests/test_seed.py -q` (failed before pytest startup because repository pyenv `3.12` is not installed)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python -m pytest tests/test_seed.py -q` (passed, 2 tests)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 --group dev ruff check apps/organizations/management/commands/_seed_demo_data.py apps/organizations/management/commands/seed_demo.py tests/test_seed.py` (passed)
  - `python3 scripts/check_simplicity.py` (passed)
  - `python3 scripts/validate_docs.py` (failed on existing decimal task heading IDs outside BE-032)
- Result: Implemented an idempotent `seed_demo` command with synthetic organizations, all roles, visible/hidden matters, case/contract/notice records, today/upcoming/overdue deadlines, tasks, document metadata, notification preferences, demo notification rows, activity/outbox from domain services, README credentials, and focused idempotency tests.
- Deviations/questions: Exact `python` verification commands are blocked by the local pyenv `3.12` setting; equivalent `/usr/bin/python3.12` uv-backed commands passed. The local Compose database required migrations before the seed command could touch document/notification tables. Documentation validation still fails on pre-existing decimal task heading IDs unrelated to BE-032.
