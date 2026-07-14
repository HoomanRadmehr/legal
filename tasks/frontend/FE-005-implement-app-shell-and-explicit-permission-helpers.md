# FE-005: Implement app shell and explicit permission helpers

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-002
Depends on: FE-004

## Goal

Create role-aware navigation and action helpers matching the permission matrix.

## Allowed scope

- `frontend/src/app/`
- `frontend/src/auth/permissions.ts`
- `frontend/src/components/layout/`
- `frontend/src/test/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-002-app-shell-permissions.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement small pure permission functions.
2. Create responsive shell/navigation/user menu.
3. Show Admin-only and role-appropriate routes/actions.
4. Handle direct forbidden/not-found responses safely.
5. Add role matrix tests.

## Acceptance criteria

- [x] Viewer has no create/edit/upload/offboarding controls.
- [x] Counsel has no owner transfer/offboarding controls.
- [x] No permission DSL or generic guard framework.
- [x] Backend denial remains authoritative.

## Verification commands

```bash
cd frontend && npm test -- --run src/auth src/components/layout
cd frontend && npm run typecheck
```

## Out of scope

- Feature-specific action rules.

## Codex execution log

- Started: 2026-07-14 18:38 +0330
- Completed: 2026-07-14 18:38 +0330
- Files changed: `frontend/src/auth/permissions.ts`, `frontend/src/auth/permissions.test.ts`, `frontend/src/components/layout/AppShell.tsx`, `frontend/src/components/layout/AppShell.test.tsx`, `frontend/src/components/layout/appShell.css`, `frontend/src/app/pages.tsx`, `frontend/src/app/routes.tsx`, `frontend/src/app/App.test.tsx`, `AI_USAGE.md`.
- Commands run: `cd frontend && npm test -- --run src/auth src/components/layout`; `cd frontend && npm run typecheck`; `cd frontend && npm test -- --run src/app`; `cd frontend && npm run lint`; `cd frontend && npm run format:check`; `cd frontend && npx prettier --write src/app/pages.tsx src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx`; final reruns of auth/layout tests, typecheck, app tests, lint, and format all passed.
- Result: Implemented explicit frontend role helpers, responsive authenticated app shell, role-aware navigation/actions, safe direct denial/not-found placeholders, and role matrix tests.
- Deviations/questions: No unresolved questions. Added colocated tests under `frontend/src/auth/` and `frontend/src/components/layout/` to match the task verification command and existing test style. Existing unrelated backend and prior frontend changes were present in the worktree and were not reverted.
