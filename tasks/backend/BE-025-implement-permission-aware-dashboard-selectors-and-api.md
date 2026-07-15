# BE-025: Implement permission-aware dashboard selectors and API

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-010
Depends on: BE-013, BE-014, BE-016, BE-015, BE-017

## Goal

Return dashboard summaries derived from the same visible records as list APIs.

## Allowed scope

- `backend/apps/dashboard/`
- `backend/apps/dashboard/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-010-dashboard.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement explicit aggregate selectors per section.
2. Build one read-only dashboard endpoint and serializer.
3. Use organization timezone for deadline/task sections.
4. Include recent permission-scoped activity after BE-026 integration.
5. Add query-count and role parity tests.
6. Add domain OpenAPI.

## Acceptance criteria

- [x] Counts equal what the user can list.
- [x] No hidden organization count leaks to Counsel/Viewer.
- [x] Response query count is bounded for seed data.
- [x] No unrestricted aggregate then Python filtering.

## Verification commands

```bash
cd backend && python -m pytest apps/dashboard/tests -q
```

## Out of scope

- Advanced analytics/charts.

## Codex execution log

- Started: 2026-07-15 10:24 +0330
- Completed: 2026-07-15 10:32 +0330
- Files changed: `backend/apps/dashboard/__init__.py`; `backend/apps/dashboard/apps.py`; `backend/apps/dashboard/selectors.py`; `backend/apps/dashboard/api/__init__.py`; `backend/apps/dashboard/api/v1/__init__.py`; `backend/apps/dashboard/api/v1/openapi.py`; `backend/apps/dashboard/api/v1/serializers.py`; `backend/apps/dashboard/api/v1/urls.py`; `backend/apps/dashboard/api/v1/views.py`; `backend/apps/dashboard/tests/__init__.py`; `backend/apps/dashboard/tests/test_dashboard_api.py`; `backend/config/settings/base.py`; `backend/config/urls.py`; `tasks/backend/BE-025-implement-permission-aware-dashboard-selectors-and-api.md`; `AI_USAGE.md`.
- Commands run: `cd backend && python -m pytest apps/dashboard/tests -q` (failed before pytest startup because `.python-version` points to uninstalled `3.12`); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 python -m pytest apps/dashboard/tests -q` (passed, 5 tests); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 ruff format apps/dashboard config/settings/base.py config/urls.py` (passed); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 ruff check apps/dashboard config/settings/base.py config/urls.py` (passed); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 ruff format --check apps/dashboard config/settings/base.py config/urls.py` (passed); `python3 scripts/check_simplicity.py backend/apps/dashboard backend/config/settings/base.py backend/config/urls.py` (passed); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with local PostgreSQL authentication warning, no changes detected); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be025-openapi.yaml --validate` (passed with existing enum naming warning); `python3 scripts/validate_docs.py` (failed on unrelated task metadata/dependency issues outside BE-025).
- Result: Implemented a read-only dashboard endpoint backed by explicit permission-aware aggregate selectors for cases, contracts, notices, deadlines, tasks, and recent matter activity.
- Deviations/questions: The allowed scope omitted `backend/config/settings/base.py` and `backend/config/urls.py`, but app registration and URL inclusion are required for the published `/api/v1/dashboard/` endpoint. Recent activity is matter-scoped and permission-filtered; organization-level activity remains for the later activity/dashboard integration work.
