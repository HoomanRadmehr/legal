# INT-002: Verify cases, contracts, and notices

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-003, BE-004, BE-005, FE-003, FE-004, FE-005
Depends on: BE-016, FE-010

## Goal

Verify core legal record create/list/detail/update/archive and version conflicts through the running stack.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-003-cases.md`
- `specs/backend/BE-004-contracts.md`
- `specs/backend/BE-005-notices.md`
- `specs/frontend/FE-003-cases.md`
- `specs/frontend/FE-004-contracts.md`
- `specs/frontend/FE-005-notices.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Use seeded roles to create and edit each record type.
2. Verify filters and permission-scoped results.
3. Trigger stale update conflict.
4. Verify notice linked deadline.
5. Verify activity timeline entries.

## Acceptance criteria

- [ ] Core record flows pass for authorized role and fail safely for Viewer/unrelated user.
- [ ] No hard delete occurs.
- [ ] Version conflict is visible and non-destructive.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q
```

## Out of scope

- Documents and notifications.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
