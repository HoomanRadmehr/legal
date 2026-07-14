# FE-009: Implement deadline views and mutations

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-006
Depends on: FE-005, FE-006, BE-015

## Goal

Deliver Today, Overdue, Upcoming, and Assigned-to-me views with explicit backend parameters.

## Allowed scope

- `frontend/src/features/deadlines/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write deadline API functions and query keys.
2. Implement four tabs mapped directly to `view` parameter.
3. Add explicit filters and organization timezone label.
4. Implement create/edit/complete/cancel actions with permission controls.
5. Handle 409/429 and query invalidation.
6. Add tests.

## Acceptance criteria

- [ ] All four view parameters are correct.
- [ ] Client does not contradict backend classification.
- [ ] Completion/cancel is reflected across lists.
- [ ] Role action visibility is correct.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/deadlines
cd frontend && npm run typecheck
```

## Out of scope

- Reminder preference UI.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
