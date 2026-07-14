# FE-004: Implement login, session restore, refresh, and logout

Status: TODO
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

- [ ] No token is stored in local/session storage.
- [ ] Parallel 401s create one refresh.
- [ ] No infinite retry.
- [ ] Logout clears state even if server session is already gone.
- [ ] CSRF bootstrap is used and CSRF is not disabled.

## Verification commands

```bash
cd frontend && npm test -- --run src/auth src/features/auth
cd frontend && npm run typecheck
```

## Out of scope

- Password reset/MFA.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
