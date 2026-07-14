# FE-009: Implement deadline views and mutations

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-006
Depends on: FE-005, FE-006, BE-015

## Goal

Deliver Today, Overdue, Upcoming, and Assigned-to-me views with explicit backend parameters.

## Allowed scope

- `frontend/src/features/deadlines/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write deadline API functions and query keys.
2. Implement four tabs mapped directly to `view` parameter.
3. Add explicit filters and organization timezone label.
4. Implement create/edit/complete/cancel actions with permission controls.
5. Handle 409/429 and query invalidation.
6. Add tests.

## Acceptance criteria

- [x] All four view parameters are correct.
- [x] Client does not contradict backend classification.
- [x] Completion/cancel is reflected across lists.
- [x] Role action visibility is correct.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/deadlines
cd frontend && npm run typecheck
```

## Out of scope

- Reminder preference UI.

## Codex execution log

- Started: 2026-07-14 20:19 +0330
- Completed: 2026-07-14 20:22 +0330
- Files changed:
  - `frontend/src/features/deadlines/`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-009-implement-deadline-views-and-mutations.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci` - passed
  - `cd frontend && npm test -- --run src/features/deadlines` - initially failed once on a test timing assertion, then passed with 3 files and 11 tests
  - `cd frontend && npm run typecheck` - passed
  - `cd frontend && npm run lint` - initially failed on a Fast Refresh constant export warning, then passed
  - `cd frontend && npm run format:check` - initially failed on new-file formatting, passed after targeted Prettier formatting
  - `cd frontend && npm run build` - passed with existing Vite chunk-size warning
  - `python3 scripts/check_simplicity.py frontend/src` - passed, scanned 118 source files
  - `python3 scripts/validate_docs.py` - initially failed while generated `frontend/node_modules` Markdown was present, passed after removing generated `frontend/node_modules` and `frontend/dist`
- Result: DONE. Implemented explicit deadline API/hooks/query keys, four backend `view` tabs, filters, create/edit/detail pages, complete/cancel actions with confirmation, permission-aware action visibility, 409/429 handling, query invalidation, and focused tests.
- Deviations/questions: The task allowed `frontend/src/app/routes.ts`, but the repository route file is `frontend/src/app/routes.tsx`; route registration was made there. The current frontend session does not expose the exact organization timezone string, so the UI displays `Organization timezone: server classified` and avoids client-side deadline classification.
