# BE-003: Add common model/API base classes and error envelope

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000, BE-012
Depends on: BE-001, BE-002

## Goal

Implement the small project-owned base classes, request IDs, pagination, and standard API errors.

## Allowed scope

- `backend/common/models.py`
- `backend/common/api/`
- `backend/common/middleware.py`
- `backend/common/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-000-foundation.md`, `specs/backend/BE-012-api-localization.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement `CommonModel` with UUID and timestamps only.
2. Implement `CommonModelSerializer`, `CommonFilterSet`, and `CommonModelViewSet` with one direct base each.
3. Disable hard delete in the common ViewSet.
4. Add request ID middleware and response header.
5. Add standard pagination and exception handler/error envelope.
6. Translate human messages with `gettext_lazy` where applicable.

## Acceptance criteria

- [x] No base class contains organization, owner, version, archive, audit, or domain behavior.
- [x] Destroy is denied by default.
- [x] Validation, not-found, permission, conflict, and throttle errors share the envelope.
- [x] Request ID is returned and logged safely.
- [x] Simplicity scanner reports no multiple inheritance.

## Verification commands

```bash
cd backend && python -m pytest common/tests -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Domain permission rules and model business logic.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `backend/common/models.py`, `backend/common/middleware.py`, `backend/common/api/errors.py`, `backend/common/api/exception_handler.py`, `backend/common/api/filters.py`, `backend/common/api/openapi.py`, `backend/common/api/pagination.py`, `backend/common/api/serializers.py`, `backend/common/api/viewsets.py`, `backend/common/tests/test_common_api_base.py`, `backend/common/tests/test_error_envelope.py`, `backend/common/tests/test_request_id_middleware.py`, `tasks/backend/BE-003-add-common-model-api-base-classes-and-error-envelope.md`, `AI_USAGE.md`
- Commands run:
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m pytest common/tests -q'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" python scripts/check_simplicity.py backend`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m ruff check .'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m compileall .'`
- Result: Passed. `common/tests` reported `15 passed`; simplicity scanner reported no violations; Ruff and compile smoke checks passed.
- Deviations/questions: No unresolved questions. To stay inside this task's allowed scope, the middleware and DRF exception/pagination primitives were implemented and tested in `common/`; global settings/URL wiring remains outside this task.
