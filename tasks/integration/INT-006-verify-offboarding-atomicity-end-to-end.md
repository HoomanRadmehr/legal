# INT-006: Verify offboarding atomicity end to end

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-011, FE-010
Depends on: BE-027, FE-017

## Goal

Verify Admin preview/execute, stale preview, retry idempotency, and final reassignment.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-011-offboarding.md`
- `specs/frontend/FE-010-offboarding.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Preview seeded departing member.
2. Verify no mutation.
3. Execute with idempotency and verify affected records.
4. Retry same request.
5. Trigger stale preview/failure and verify rollback.
6. Verify non-Admin denial.

## Acceptance criteria

- [ ] No orphaned active work.
- [ ] Duplicate execution is one logical run.
- [ ] Rollback is complete.
- [ ] UI communicates stale preview.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_offboarding.py -q
```

## Out of scope

- External HR systems.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
