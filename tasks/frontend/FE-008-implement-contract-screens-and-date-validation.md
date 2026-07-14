# FE-008: Implement contract screens and date validation

Status: TODO
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

- [ ] Date ordering and 422 mapping are clear.
- [ ] Version conflict and permissions match spec.
- [ ] Expiring/renewing state is accessible without color-only meaning.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/contracts
cd frontend && npm run typecheck
```

## Out of scope

- Jalali conversion; added in FE-018.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
