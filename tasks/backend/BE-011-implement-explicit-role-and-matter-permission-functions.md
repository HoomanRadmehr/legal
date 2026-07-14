# BE-011: Implement explicit role and matter permission functions

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-002
Depends on: BE-008, BE-003

## Goal

Create readable permission functions and one common permission base without a policy engine.

## Allowed scope

- `backend/common/permissions.py`
- `backend/apps/organizations/permissions.py`
- `backend/apps/matters/permissions.py`
- `backend/apps/organizations/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-002-organizations-permissions.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement active membership resolver.
2. Implement role checks for admin/manager/counsel/viewer.
3. Implement matter view/edit rules as functions against ownership and grants.
4. Create one domain permission class pattern that calls the functions.
5. Return not-visible behavior without data leakage.
6. Add complete role matrix tests with two organizations.

## Acceptance criteria

- [ ] Every function is small and explicit.
- [ ] Inactive membership denies access.
- [ ] Cross-organization access is denied before object retrieval.
- [ ] No bitwise permission expression or registry is used.
- [ ] Role matrix matches business document.

## Verification commands

```bash
cd backend && python -m pytest apps/organizations/tests apps/matters/tests -q
```

## Out of scope

- Matter models and access grant writes.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
