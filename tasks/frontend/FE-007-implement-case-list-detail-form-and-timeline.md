# FE-007: Implement case list, detail, form, and timeline

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-003
Depends on: FE-005, FE-006, BE-013

## Goal

Deliver explicit case screens with filters, parties, version conflict, archive, and timeline.

## Allowed scope

- `frontend/src/features/cases/`
- `frontend/src/app/routes.ts`
- `frontend/src/api/generated/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-003-cases.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write case types/API functions/query keys.
2. Implement list filters and pagination.
3. Implement create/edit Zod schemas and party field array.
4. Implement detail sections and timeline.
5. Handle 409 conflict and archive confirmation.
6. Apply permission-aware actions and tests.

## Acceptance criteria

- [x] Filters match backend contract.
- [x] Viewer is read-only.
- [x] Conflict does not silently overwrite.
- [x] Archive is not presented as delete.
- [x] Timeline uses safe action labels.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/cases
cd frontend && npm run typecheck
```

## Out of scope

- Generic record form or documents implementation.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 20:04 +0330
- Files changed: `frontend/src/features/cases/`, `frontend/src/app/routes.tsx`, `tasks/frontend/FE-007-implement-case-list-detail-form-and-timeline.md`, `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm test -- --run src/features/cases`
  - `cd frontend && npm ci`
  - `cd frontend && npm test -- --run src/features/cases`
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run format:check`
  - `/usr/bin/python3.12 scripts/check_simplicity.py frontend/src`
  - `/usr/bin/python3.12 scripts/validate_docs.py`
  - `cd frontend && npm run build`
- Result: DONE. Implemented explicit case list/detail/create/edit screens, typed case API functions, query keys, Zod schemas, party field array, permission-aware actions, archive confirmation, version conflict messaging, timeline safe labels, and focused feature tests. Final required verification passed with 4 test files and 8 tests.
- Deviations/questions: The allowed scope names `frontend/src/app/routes.ts`, but this repo uses `frontend/src/app/routes.tsx`; route wiring was made in the existing file. The spec mentions loading active owner choices, but no memberships API exists in the current frontend/backend surface; the form keeps owner assignment optional and explicit by membership ID without adding an out-of-scope organizations feature. `npm ci` was required because `node_modules` was absent; generated `frontend/node_modules` and `frontend/dist` were removed after verification so docs validation would not scan third-party Markdown.
