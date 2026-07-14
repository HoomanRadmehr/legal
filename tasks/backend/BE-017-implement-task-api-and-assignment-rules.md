# BE-017: Implement task API and assignment rules

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-006
Depends on: BE-012, BE-019, BE-018

## Goal

Deliver simple matter-linked tasks with explicit assignment, filters, completion, and cancellation.

## Allowed scope

- `backend/apps/tasks/`
- `backend/apps/tasks/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-006-deadlines-tasks.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Task model with explicit organization/matter/assignee/status/due/version.
2. Implement permission-scoped selectors.
3. Implement create/update/complete/cancel services and role assignment rules.
4. Add ModelSerializers, ViewSet, FilterSet, OpenAPI.
5. Add audit/outbox and tests.

## Acceptance criteria

- [ ] Cross-org/inactive assignee is rejected.
- [ ] Counsel cannot reassign another user where matrix denies it.
- [ ] Completion/cancellation is idempotent.
- [ ] Viewer is read-only.
- [ ] Filters and ordering are allowlisted.

## Verification commands

```bash
cd backend && python -m pytest apps/tasks/tests -q
```

## Out of scope

- Comments, subtasks, or kanban framework.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
