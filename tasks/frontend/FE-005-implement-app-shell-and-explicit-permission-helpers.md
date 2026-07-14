# FE-005: Implement app shell and explicit permission helpers

Status: TODO
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

- [ ] Viewer has no create/edit/upload/offboarding controls.
- [ ] Counsel has no owner transfer/offboarding controls.
- [ ] No permission DSL or generic guard framework.
- [ ] Backend denial remains authoritative.

## Verification commands

```bash
cd frontend && npm test -- --run src/auth src/components/layout
cd frontend && npm run typecheck
```

## Out of scope

- Feature-specific action rules.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
