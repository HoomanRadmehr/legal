# FE-011: Implement task list and matter task sections

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-006
Depends on: FE-005, BE-017

## Goal

Deliver task list/create/edit/complete/cancel with assignment boundaries.

## Allowed scope

- `frontend/src/features/tasks/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write task API functions/query keys.
2. Implement filters and assigned-to-me default where appropriate.
3. Implement create/edit form with active allowed assignees.
4. Implement complete/cancel and query invalidation.
5. Apply role controls and tests.

## Acceptance criteria

- [ ] Viewer cannot mutate.
- [ ] Counsel cannot see unauthorized reassignment controls.
- [ ] 409/429 and idempotent completion states are handled.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/tasks
cd frontend && npm run typecheck
```

## Out of scope

- Subtasks/comments.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
