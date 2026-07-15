# FE-014: Implement dashboard

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-008
Depends on: FE-007, FE-008, FE-009, FE-010, FE-011, BE-025

## Goal

Render permission-aware workload summary and pre-filtered links.

## Allowed scope

- `frontend/src/features/dashboard/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-008-dashboard.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write dashboard API/query.
2. Render case/contract/notice/deadline/task/activity sections.
3. Link cards to explicit filter routes.
4. Add loading/empty/error/429 states.
5. Use accessible urgency indicators and RTL-compatible layout.
6. Add tests.

## Acceptance criteria

- [x] No client-generated hidden total.
- [x] Links preserve filters.
- [x] Urgency is not color-only.
- [x] Role-specific wording is accurate.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/dashboard
cd frontend && npm run typecheck
```

## Out of scope

- Charts/analytics.

## Codex execution log

- Started: 2026-07-15 14:39 +0330
- Completed: 2026-07-15 14:46 +0330
- Files changed:
  - `frontend/src/features/dashboard/api.ts`
  - `frontend/src/features/dashboard/dashboard.css`
  - `frontend/src/features/dashboard/hooks.ts`
  - `frontend/src/features/dashboard/index.ts`
  - `frontend/src/features/dashboard/links.ts`
  - `frontend/src/features/dashboard/pages/DashboardPage.tsx`
  - `frontend/src/features/dashboard/tests/DashboardPage.test.tsx`
  - `frontend/src/features/dashboard/text.ts`
  - `frontend/src/features/dashboard/types.ts`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-014-implement-dashboard.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm test -- --run src/features/dashboard` initially failed before dependency install because `vitest` was unavailable.
  - `cd frontend && npm ci` passed, restoring locked frontend dependencies.
  - `cd frontend && npm test -- --run src/features/dashboard` passed, 1 file and 6 tests.
  - `cd frontend && npm run typecheck` passed.
  - `cd frontend && npm run format:check` passed after targeted Prettier formatting.
  - `cd frontend && npx eslint src/features/dashboard src/app/routes.tsx --max-warnings=0` passed.
  - `python3 scripts/check_simplicity.py frontend/src/features/dashboard frontend/src/app/routes.tsx` passed, scanned 8 source files.
- Result: Added a permission-aware dashboard page backed by `GET /api/v1/dashboard/`, rendered case, contract, notice, deadline, task, and recent activity sections from server-returned values, added filter-preserving links, accessible urgency text, loading/empty/error/rate-limit states, role-specific wording, and English/Persian RTL-compatible dashboard copy.
- Deviations/questions: The task allowed `frontend/src/app/routes.ts`, but this repository uses `frontend/src/app/routes.tsx`; route wiring was applied there. Some aggregate cards represent backend OR summaries while current list pages expose narrower filters, so those links use the closest explicit filter/sort route without inventing new list filters.
