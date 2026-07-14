# FE-008: Implement contract screens and date validation

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-004
Depends on: FE-005, FE-006, BE-014

## Goal

Deliver contract list/detail/create/edit/archive with explicit date behavior.

## Allowed scope

- `frontend/src/features/contracts/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-004-contracts.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write contract API functions and query keys.
2. Implement list filters including counterparty/date ranges.
3. Implement form with effective/expiration/renewal validation and version.
4. Implement detail/timeline/actions.
5. Map backend date errors to fields and add tests.

## Acceptance criteria

- [x] Date ordering and 422 mapping are clear.
- [x] Version conflict and permissions match spec.
- [x] Expiring/renewing state is accessible without color-only meaning.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/contracts
cd frontend && npm run typecheck
```

## Out of scope

- Jalali conversion; added in FE-018.

## Codex execution log

- Started: 2026-07-14 20:12 +0330
- Completed: 2026-07-14 20:14 +0330
- Files changed:
  - `frontend/src/features/contracts/`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-008-implement-contract-screens-and-date-validation.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci` - passed
  - `cd frontend && npm test -- --run src/features/contracts` - initially failed once because a fake-timer test stalled TanStack Query, failed once because an edit fixture used an invalid renewal date, then passed with 4 files and 9 tests
  - `cd frontend && npm run typecheck` - initially failed on strict field/schema typing, then passed
  - `cd frontend && npm run lint` - passed
  - `cd frontend && npm run format:check` - initially failed on new-file formatting, passed after targeted Prettier formatting
  - `cd frontend && npm run build` - passed with existing Vite chunk-size warning
  - `python3 scripts/check_simplicity.py frontend/src` - passed, scanned 95 source files
  - `python3 scripts/validate_docs.py` - initially failed while generated `frontend/node_modules` Markdown was present, passed after removing generated `frontend/node_modules` and `frontend/dist`
- Result: DONE. Implemented explicit contract API/hooks/query keys, list filters, create/edit/detail/archive/timeline screens, effective/expiration/renewal validation, backend date error field mapping, stale-version handling, permission-aware controls, and accessible renewal/expiration state text.
- Deviations/questions: The task allowed `frontend/src/app/routes.ts`, but the repository route file is `frontend/src/app/routes.tsx`; route registration was made there. FE-004 includes Jalali round-trip acceptance, but FE-008 explicitly marks Jalali conversion out of scope for FE-018, so this implementation keeps ISO date inputs and API values.
