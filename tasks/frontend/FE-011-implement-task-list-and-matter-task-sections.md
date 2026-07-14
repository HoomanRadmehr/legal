# FE-011: Implement task list and matter task sections

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-006
Depends on: FE-005, BE-017

## Goal

Deliver task list/create/edit/complete/cancel with assignment boundaries.

## Allowed scope

- `frontend/src/features/tasks/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write task API functions/query keys.
2. Implement filters and assigned-to-me default where appropriate.
3. Implement create/edit form with active allowed assignees.
4. Implement complete/cancel and query invalidation.
5. Apply role controls and tests.

## Acceptance criteria

- [x] Viewer cannot mutate.
- [x] Counsel cannot see unauthorized reassignment controls.
- [x] 409/429 and idempotent completion states are handled.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/tasks
cd frontend && npm run typecheck
```

## Out of scope

- Subtasks/comments.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `frontend/src/features/tasks/`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-011-implement-task-list-and-matter-task-sections.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci`
  - `cd frontend && npx prettier --write src/features/tasks src/app/routes.tsx`
  - `cd frontend && npm test -- --run src/features/tasks` (initially failed on duplicate 429 retry text assertion and matter action task id binding; passed after fixes)
  - `cd frontend && npm run typecheck` (initially failed on test fixture/mock typings; passed after fixes)
  - `cd frontend && npm run lint` (initially failed on lint-only issues; passed after fixes)
  - `cd frontend && npm run format:check`
  - `cd frontend && npm run build`
  - `python3 scripts/check_simplicity.py frontend/src/features/tasks frontend/src/app/routes.tsx`
  - `python3 scripts/validate_docs.py`
- Result: Implemented explicit task API functions, hooks, list/detail/create/edit pages, task filters, active assignee form controls, viewer/counsel role controls, complete/cancel confirmations, task mutation error handling, and a matter-scoped task section. Required verification commands passed.
- Deviations/questions: The task allowed scope names `frontend/src/app/routes.ts`, but the repository router file is `frontend/src/app/routes.tsx`; route wiring was applied there. Active assignee choices use the documented `/memberships/` API and filter out non-active choices client-side as a UX guard; backend authorization remains authoritative.
