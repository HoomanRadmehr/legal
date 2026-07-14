# BE-015: Implement Deadline model, views, and mutations

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-006
Depends on: BE-012, BE-019, BE-018

## Goal

Create common deadline storage and all four required permission-aware timezone views.

## Allowed scope

- `backend/apps/deadlines/`
- `backend/apps/deadlines/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Deadline model with organization, matter, assignee, due_at, status, priority, reminder flag, version.
2. Implement explicit view selectors for today/upcoming/overdue/assigned_to_me using organization timezone.
3. Implement create/update/complete/cancel services with authorization, idempotent final actions, activity/outbox.
4. Add ViewSet, ModelSerializers, FilterSet, indexes, OpenAPI.
5. Add frozen-time and role tests.

## Acceptance criteria

- [ ] All four views match spec at timezone boundaries.
- [ ] Completed/cancelled deadlines are excluded from open views.
- [ ] Assignee must be active and same organization.
- [ ] Complete/cancel are idempotent.
- [ ] Query is matter-permission-scoped.

## Verification commands

```bash
cd backend && python -m pytest apps/deadlines/tests -q
```

## Out of scope

- Reminder delivery jobs and notice synchronization.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
