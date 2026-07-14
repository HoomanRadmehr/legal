# FE-007: Implement case list, detail, form, and timeline

Status: TODO
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

- [ ] Filters match backend contract.
- [ ] Viewer is read-only.
- [ ] Conflict does not silently overwrite.
- [ ] Archive is not presented as delete.
- [ ] Timeline uses safe action labels.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/cases
cd frontend && npm run typecheck
```

## Out of scope

- Generic record form or documents implementation.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
