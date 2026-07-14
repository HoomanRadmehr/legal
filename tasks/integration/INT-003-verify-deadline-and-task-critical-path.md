# INT-003: Verify deadline and task critical path

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-006, FE-006
Depends on: BE-017, FE-011

## Goal

Verify today/upcoming/overdue/assigned views, completion, assignment, and organization timezone.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-006-deadlines-tasks.md`
- `specs/frontend/FE-006-deadlines-tasks.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Freeze or seed deterministic times.
2. Check four deadline views for multiple roles.
3. Complete/cancel and verify dashboard/list updates.
4. Test cross-org/inactive assignee.
5. Verify task flows.

## Acceptance criteria

- [ ] Required views agree between API and UI.
- [ ] Timezone boundary is documented and correct.
- [ ] Completion is idempotent.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q
```

## Out of scope

- Provider reminder delivery.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
