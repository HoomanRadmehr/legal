# INT-007: Verify Persian locale, RTL, and Jalali dates

Status: BLOCKED
Priority: P0
Area: Integration
Related specs: BE-012, FE-011
Depends on: BE-028, FE-018

## Goal

Verify localized API messages and end-to-end Jalali date round-trip in critical forms.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-012-api-localization.md`
- `specs/frontend/FE-011-localization-accessibility.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Switch Persian locale and RTL.
2. Create contract/notice/deadline with Jalali input.
3. Verify ISO backend storage/response.
4. Reload and compare displayed Jalali date.
5. Verify canonical status codes unchanged.

## Acceptance criteria

- [ ] No date shift.
- [ ] RTL critical flows are usable.
- [ ] Localized messages and canonical values behave as specified.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_localization.py -q
```

## Out of scope

- Full translation QA.

## Codex execution log

- Started: 2026-07-15
- Completed: 2026-07-15
- Files changed:
  - `backend/tests/integration/test_localization.py`
  - `frontend/src/test/integration/localization.test.ts`
  - `tasks/integration/INT-007-verify-persian-locale-rtl-and-jalali-dates.md`
  - `AI_USAGE.md`
- Commands run:
  - `docker compose run --rm api python -m pytest tests/integration/test_localization.py -q` (failed: `/opt/venv/bin/python: No module named pytest`)
  - `docker compose up -d postgres redis rabbitmq minio minio-init api` (passed; live services started)
  - `curl -fsS http://127.0.0.1:8000/health/ready/` (passed after API startup)
  - `cd backend && DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management REDIS_URL=redis://127.0.0.1:6379/0 CHANNEL_LAYER_REDIS_URL=redis://127.0.0.1:6379/1 CELERY_BROKER_URL=amqp://legal_management:legal_management_dev_password@127.0.0.1:5672// MINIO_ENDPOINT=127.0.0.1:9000 INTEGRATION_API_BASE_URL=http://127.0.0.1:8000 UV_PROJECT_ENVIRONMENT=/tmp/legal-int007-venv uv run --python /usr/bin/python3.12 python -m pytest tests/integration/test_localization.py -q` (failed as support evidence because pytest-django seeded its isolated test database while the live API read the Compose development database)
  - `cd frontend && npm ci` (passed)
  - `cd frontend && npm test -- --run src/test/integration/localization.test.ts` (passed)
  - `python3 scripts/check_simplicity.py` (passed after splitting the integration test helper)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int007-venv uv run --python /usr/bin/python3.12 --group dev ruff check tests/integration/test_localization.py` (passed)
  - `python3 scripts/validate_docs.py` (failed on pre-existing decimal task heading IDs outside INT-007 allowed scope)
- Result: BLOCKED. The integration evidence was added, but the exact required Compose verification command cannot run because the API runtime image does not include `pytest`; documentation validation also remains blocked by pre-existing decimal task heading IDs.
- Deviations/questions: The Compose pytest blocker belongs outside this task's allowed scope; the owning area is backend runtime/test packaging from the backend CI/production image tasks. No product code was changed.
