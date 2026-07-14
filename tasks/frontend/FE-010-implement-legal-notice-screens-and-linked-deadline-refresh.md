# FE-010: Implement legal notice screens and linked deadline refresh

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-005
Depends on: FE-007, FE-009, BE-016

## Goal

Deliver notice intake, related matter selection, detail, update, archive, and linked deadline refresh.

## Allowed scope

- `frontend/src/features/notices/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-005-notices.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write notice API functions.
2. Implement list/detail/form with received and response dates.
3. Implement permission-scoped related matter search using explicit case/contract APIs.
4. On mutation invalidate notice and deadline queries.
5. Handle invalid date, hidden relation, version conflict, and archive.
6. Add tests.

## Acceptance criteria

- [x] Invisible relation choices never appear.
- [x] Linked deadline refreshes after notice update.
- [x] Date and permission errors are clear.
- [x] No generic relation UI is created.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/notices
cd frontend && npm run typecheck
```

## Out of scope

- Advanced response workflow.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `frontend/src/features/notices/`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-010-implement-legal-notice-screens-and-linked-deadline-refresh.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci` - passed, 371 packages installed, 0 vulnerabilities; rerun after generated dependency cleanup also passed.
  - `cd frontend && npm test -- --run src/features/notices` - initially failed because the new form tests needed a QueryClient wrapper; a post-cleanup rerun also failed while `node_modules` was absent; passed after reinstalling dependencies, 3 files and 9 tests.
  - `cd frontend && npm run typecheck` - a post-cleanup rerun failed while `node_modules` was absent; passed after reinstalling dependencies.
  - `cd frontend && npm run lint` - passed.
  - `cd frontend && npm run format:check` - initially failed on new notice file formatting; passed after `cd frontend && npx prettier --write src/features/notices src/app/routes.tsx`.
  - `python3 scripts/check_simplicity.py frontend/src/features/notices frontend/src/app/routes.tsx` - passed, scanned 23 source files.
  - `cd frontend && npm run build` - passed with Vite chunk-size warning for the bundled app.
  - `python3 scripts/validate_docs.py` - passed after removing generated `frontend/node_modules` and `frontend/dist`, 27 specs, 63 tasks, 172 Markdown files.
- Result: Implemented explicit legal notice API functions, query keys, hooks, list/detail/create/edit screens, related case/contract search and resolved detail links, linked deadline status/assignee display, archive confirmation, linked deadline query invalidation, and focused tests for invisible relation choices, deadline refresh, date errors, hidden relation errors, version conflicts, and viewer read-only behavior.
- Deviations/questions: The task allowed `frontend/src/app/routes.ts`; this repository uses `frontend/src/app/routes.tsx`, so route wiring was added there.
