# BE-029: Review filters, indexes, and query efficiency

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-003, BE-004, BE-005, BE-006, BE-010, BE-012
Depends on: BE-013, BE-014, BE-016, BE-015, BE-017, BE-021, BE-025

## Goal

Make filtering explicit and ensure common permission-aware lists avoid obvious N+1 and unindexed deadline paths.

## Allowed scope

- `backend/apps/`
- `backend/common/api/`
- `backend/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-003-cases.md`, `specs/backend/BE-004-contracts.md`, `specs/backend/BE-005-notices.md`, `specs/backend/BE-006-deadlines-tasks.md`, `specs/backend/BE-010-dashboard.md`, `specs/backend/BE-012-api-localization.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Review every FilterSet for explicit fields and ordering allowlist.
2. Add/select database indexes for organization/status/owner/assignee/due/reference.
3. Add `select_related`/`prefetch_related` only where measured or clear.
4. Add query-count regression tests for representative lists/dashboard.
5. Document any accepted tradeoff.

## Acceptance criteria

- [x] No `fields="__all__"` or unrestricted ordering.
- [x] Common lists avoid N+1 on seeded data.
- [x] Deadline/dashboard queries use relevant indexes.
- [x] Security scope is not bypassed for performance.

## Verification commands

```bash
cd backend && python -m pytest -q
cd backend && python manage.py makemigrations --check --dry-run
```

## Out of scope

- Database-specific premature optimization beyond MVP.

## Codex execution log

- Started: 2026-07-15 16:39 +0330
- Completed: 2026-07-15 16:43 +0330
- Files changed:
  - `backend/apps/matters/models.py`
  - `backend/apps/matters/migrations/0002_matter_matter_org_kind_prio_idx_and_more.py`
  - `backend/apps/tasks/models.py`
  - `backend/apps/tasks/migrations/0002_task_task_org_assignee_due_idx.py`
  - `backend/apps/documents/models.py`
  - `backend/apps/documents/migrations/0003_document_doc_org_filename_idx.py`
  - `backend/apps/dashboard/selectors.py`
  - `backend/apps/dashboard/tests/test_dashboard_api.py`
  - `backend/tests/test_filters_indexes.py`
  - `tasks/backend/BE-029-review-filters-indexes-and-query-efficiency.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be029-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations matters tasks documents` - generated index migrations; emitted a local PostgreSQL credential warning during migration-history check.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be029-venv uv run --python /usr/bin/python3.12 python -m pytest tests/test_filters_indexes.py apps/dashboard/tests/test_dashboard_api.py -q` - passed, 11 tests.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be029-venv uv run --python /usr/bin/python3.12 ruff check apps/matters/models.py apps/tasks/models.py apps/documents/models.py apps/dashboard/selectors.py apps/dashboard/tests/test_dashboard_api.py tests/test_filters_indexes.py apps/matters/migrations/0002_matter_matter_org_kind_prio_idx_and_more.py apps/tasks/migrations/0002_task_task_org_assignee_due_idx.py apps/documents/migrations/0003_document_doc_org_filename_idx.py` - passed after sorting an import and formatting generated migrations.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be029-venv uv run --python /usr/bin/python3.12 ruff format --check apps/matters/models.py apps/tasks/models.py apps/documents/models.py apps/dashboard/selectors.py apps/dashboard/tests/test_dashboard_api.py tests/test_filters_indexes.py apps/matters/migrations/0002_matter_matter_org_kind_prio_idx_and_more.py apps/tasks/migrations/0002_task_task_org_assignee_due_idx.py apps/documents/migrations/0003_document_doc_org_filename_idx.py` - passed.
  - `cd backend && python -m pytest -q` - failed before pytest startup because `.python-version` points to unavailable pyenv `3.12`.
  - `cd backend && python manage.py makemigrations --check --dry-run` - failed before Django startup because `.python-version` points to unavailable pyenv `3.12`.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be029-venv uv run --python /usr/bin/python3.12 python -m pytest -q` - passed, 30 tests.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be029-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` - passed with no changes detected; emitted the same local PostgreSQL credential warning.
  - `python3 scripts/check_simplicity.py` - passed, scanned 506 source files.
  - `python3 scripts/validate_docs.py` - failed on pre-existing invalid task heading IDs in decimal task files outside BE-029 scope.
- Result: DONE. Added targeted indexes for reviewed matter, task, and document list/dashboard paths; reduced dashboard recent-activity query work through the permission-scoped matter selector; tightened the dashboard query-count regression; and added filter/order/index regression tests.
- Deviations/questions: Exact `python ...` verification commands remain blocked by the repository pyenv `3.12` configuration, but equivalent `/usr/bin/python3.12` uv-backed commands passed. Migration commands emit a local PostgreSQL credential warning while using the configured default database for history checks; the dry-run still reports no model drift. Documentation validation remains blocked by existing invalid decimal task heading IDs in `BE-038`, `BE-036`, `BE-037`, `FE-022`, `FE-023`, and `FE-024`.
