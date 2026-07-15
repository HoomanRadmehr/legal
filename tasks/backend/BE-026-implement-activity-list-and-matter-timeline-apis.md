# BE-026: Implement activity list and matter timeline APIs

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-008
Depends on: BE-019, BE-011

## Goal

Expose read-only permission-scoped activity and matter timelines.

## Allowed scope

- `backend/apps/activity/api/v1/`
- `backend/apps/activity/selectors.py`
- `backend/apps/activity/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-008-activity-outbox.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement global activity selector scoped by role and visible matters.
2. Implement matter timeline selector.
3. Add read-only ViewSet/list endpoints, explicit filters, pagination, OpenAPI.
4. Map/redact before/after values according to action allowlist.
5. Prohibit create/update/delete actions.

## Acceptance criteria

- [x] Viewer/Counsel cannot see activity for hidden matters.
- [x] No mutation endpoint exists.
- [x] Newest-first ordering and filters are stable.
- [x] Sensitive fields remain redacted.

## Verification commands

```bash
cd backend && python -m pytest apps/activity/tests -q
```

## Out of scope

- Full forensic audit export.

## Codex execution log

- Started: 2026-07-15 10:38 +0330
- Completed: 2026-07-15 10:38 +0330
- Files changed:
  - `backend/apps/activity/selectors.py`
  - `backend/apps/activity/api/v1/__init__.py`
  - `backend/apps/activity/api/v1/filters.py`
  - `backend/apps/activity/api/v1/openapi.py`
  - `backend/apps/activity/api/v1/serializers.py`
  - `backend/apps/activity/api/v1/urls.py`
  - `backend/apps/activity/api/v1/views.py`
  - `backend/apps/activity/tests/test_activity_api.py`
  - `backend/config/urls.py`
  - `tasks/backend/BE-026-implement-activity-list-and-matter-timeline-apis.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python -m pytest apps/activity/tests -q` (failed before pytest startup because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 python -m pytest apps/activity/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 ruff check apps/activity config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 ruff format apps/activity/api/v1/urls.py apps/activity/tests/test_activity_api.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 ruff format --check apps/activity config/urls.py`
  - `python3 scripts/check_simplicity.py backend/apps/activity backend/config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be026-openapi.yaml --validate`
  - `python3 scripts/validate_docs.py`
- Result: Implemented and verified read-only permission-scoped activity and matter timeline APIs. Targeted activity tests passed with 14 tests; lint, format, simplicity, migration drift, and OpenAPI validation passed.
- Deviations/questions: Added `backend/config/urls.py` route wiring because the documented endpoints cannot resolve without root URL inclusion. `python3 scripts/validate_docs.py` failed on unrelated malformed decimal task files and missing task dependency references outside BE-026.
