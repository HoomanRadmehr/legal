# BE-029: Review filters, indexes, and query efficiency

Status: TODO
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

- [ ] No `fields="__all__"` or unrestricted ordering.
- [ ] Common lists avoid N+1 on seeded data.
- [ ] Deadline/dashboard queries use relevant indexes.
- [ ] Security scope is not bypassed for performance.

## Verification commands

```bash
cd backend && python -m pytest -q
cd backend && python manage.py makemigrations --check --dry-run
```

## Out of scope

- Database-specific premature optimization beyond MVP.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
