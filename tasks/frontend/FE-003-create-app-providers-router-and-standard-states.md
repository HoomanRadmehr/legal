# FE-003: Create app providers, router, and standard states

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-000
Depends on: FE-001, FE-002

## Goal

Wire Router, TanStack Query, localization provider placeholder, error boundary, and common loading/empty/error components.

## Allowed scope

- `frontend/src/app/`
- `frontend/src/components/`
- `frontend/src/test/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-000-foundation.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create provider composition explicitly in one file.
2. Create public/protected route placeholders.
3. Configure QueryClient retry defaults.
4. Create accessible loading, empty, error, forbidden/not-found components.
5. Add app smoke tests.

## Acceptance criteria

- [x] Provider tree is explicit and shallow.
- [x] No HOC factory or provider registry.
- [x] Unexpected render error is contained; normal API errors remain feature-local.

## Verification commands

```bash
cd frontend && npm run typecheck
cd frontend && npm test -- --run src/app src/components
```

## Out of scope

- Authentication details and domain pages.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `frontend/src/app/App.tsx`
  - `frontend/src/app/App.test.tsx`
  - `frontend/src/app/localization.ts`
  - `frontend/src/app/pages.tsx`
  - `frontend/src/app/providers.tsx`
  - `frontend/src/app/queryClient.ts`
  - `frontend/src/app/queryClient.test.ts`
  - `frontend/src/app/routeError.tsx`
  - `frontend/src/app/router.tsx`
  - `frontend/src/app/routes.tsx`
  - `frontend/src/app/styles.css`
  - `frontend/src/components/standardStates.tsx`
  - `frontend/src/components/standardStates.test.tsx`
  - `tasks/frontend/FE-003-create-app-providers-router-and-standard-states.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci`
  - `cd frontend && npm run format`
  - `cd frontend && npm run typecheck` (initial deliberate crashing test component return type fixed and rerun)
  - `cd frontend && npm test -- --run src/app src/components`
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm test -- --run src/app src/components`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run format:check`
  - `cd frontend && npm run build`
  - `/usr/bin/python3 scripts/check_simplicity.py frontend`
  - `/usr/bin/python3 scripts/validate_docs.py`
- Result: Passed. Required app/component test run covered 3 files and 8 tests; frontend simplicity check scanned 23 source files.
- Deviations/questions: React Router route `errorElement` is used for unexpected render error containment so application code remains function-component-only. No unresolved questions remain.
