# BE-004: Configure DRF filters, OpenAPI, health, and structured logging

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000, BE-012
Depends on: BE-003

## Goal

Complete cross-cutting transport configuration without introducing domain abstractions.

## Allowed scope

- `backend/common/api/`
- `backend/common/health/`
- `backend/common/logging.py`
- `backend/config/urls.py`
- `backend/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-000-foundation.md`, `specs/backend/BE-012-api-localization.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Configure DjangoFilterBackend and explicit ordering defaults.
2. Configure drf-spectacular and common error components.
3. Implement liveness and bounded readiness endpoints.
4. Configure safe structured log fields and redaction filter.
5. Add schema and health smoke tests.

## Acceptance criteria

- [x] No filter exposes all model fields automatically.
- [x] Health output contains no topology or credentials.
- [x] OpenAPI can be generated and common errors are reusable.
- [x] Token/cookie/presigned URL patterns are redacted from logs.

## Verification commands

```bash
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
cd backend && python -m pytest common/tests tests/test_health.py -q
```

## Out of scope

- Domain OpenAPI declarations and monitoring platform integration.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `backend/common/api/openapi.py`, `backend/common/api/viewsets.py`, `backend/common/health/__init__.py`, `backend/common/health/serializers.py`, `backend/common/health/views.py`, `backend/common/logging.py`, `backend/config/urls.py`, `backend/common/tests/test_common_api_base.py`, `backend/common/tests/test_logging.py`, `backend/common/tests/test_openapi_components.py`, `backend/tests/test_health.py`, `tasks/backend/BE-004-configure-drf-filters-openapi-health-and-structured-logging.md`, `AI_USAGE.md`
- Commands run:
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m pytest common/tests tests/test_health.py -q'` (initial run failed on an over-greedy cookie redaction test; fixed and reran)
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m pytest common/tests tests/test_health.py -q'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" python scripts/check_simplicity.py backend`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m ruff check .'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m compileall .'`
- Result: Passed after the scoped redaction fix. OpenAPI generation/validation exited 0; common and health tests reported `22 passed`; simplicity scanner, Ruff, and compile smoke checks passed.
- Deviations/questions: No unresolved questions. Changes stayed inside the task's allowed transport scope; settings-module wiring beyond existing schema configuration was not changed.
