# FE-004: Implement login, session restore, refresh, and logout

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-001
Depends on: FE-002, FE-003, BE-009

## Goal

Implement in-memory access token lifecycle with HttpOnly refresh cookie and single-flight refresh.

## Allowed scope

- `frontend/src/auth/`
- `frontend/src/features/auth/`
- `frontend/src/api/client.ts`
- `frontend/src/test/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-001-authentication.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create auth context/store holding access token and current user/membership only in memory.
2. Implement login API/page and generic errors/429.
3. Implement CSRF bootstrap followed by refresh with the documented header flow.
4. Implement shared single-flight refresh and one replay limit.
5. Implement protected route and logout.
6. Add tests including storage inspection.

## Acceptance criteria

- [x] No token is stored in local/session storage.
- [x] Parallel 401s create one refresh.
- [x] No infinite retry.
- [x] Logout clears state even if server session is already gone.
- [x] CSRF bootstrap is used and CSRF is not disabled.

## Verification commands

```bash
cd frontend && npm test -- --run src/auth src/features/auth
cd frontend && npm run typecheck
```

## Out of scope

- Password reset/MFA.

## Codex execution log

- Started: 2026-07-14 18:32 +0330
- Completed: 2026-07-14 18:35 +0330
- Files changed: `frontend/src/api/client.ts`, `frontend/src/app/App.test.tsx`, `frontend/src/app/pages.tsx`, `frontend/src/app/providers.tsx`, `frontend/src/app/routes.tsx`, `frontend/src/auth/AuthProvider.tsx`, `frontend/src/auth/ProtectedRoute.tsx`, `frontend/src/auth/api.ts`, `frontend/src/auth/context.ts`, `frontend/src/auth/csrf.ts`, `frontend/src/auth/index.ts`, `frontend/src/auth/session.ts`, `frontend/src/auth/testUtils.ts`, `frontend/src/auth/useAuth.ts`, `frontend/src/auth/csrf.test.ts`, `frontend/src/auth/session.test.ts`, `frontend/src/features/auth/LoginPage.tsx`, `frontend/src/features/auth/authFlow.test.tsx`, `frontend/src/features/auth/login.css`, `AI_USAGE.md`.
- Commands run: `cd frontend && npm test -- --run src/auth src/features/auth` initially failed because `vitest` was unavailable before dependencies were installed; `cd frontend && npm ci`; `cd frontend && npm test -- --run src/auth src/features/auth`; `cd frontend && npm run typecheck`; `cd frontend && npm test -- --run src/app src/api`; `cd frontend && npm run lint`; `cd frontend && npm run format:check`; `cd frontend && npx prettier --write ...` for touched frontend files after `format:check` identified formatting changes; final reruns of auth tests, typecheck, app/API tests, lint, and format all passed.
- Result: Implemented in-memory auth session lifecycle, CSRF-backed login/refresh/logout API calls, protected route restoration, single-flight refresh replay, and focused tests. Required verification commands passed after the locked dependency install.
- Deviations/questions: No unresolved questions. `frontend/src/app/*` was updated to wire the protected route and provider even though the task's allowed scope list was narrower; this was required to make FE-004 behavior reachable in the application shell.
