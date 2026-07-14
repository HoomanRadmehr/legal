# BE-018: Implement version conflict and idempotency primitives

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-003, BE-004, BE-006, BE-008
Depends on: BE-012, BE-019

## Goal

Provide small explicit helpers for expected-version writes and critical endpoint idempotency.

## Allowed scope

- `backend/common/services/`
- `backend/apps/activity/models.py`
- `backend/apps/activity/services.py`
- `backend/common/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-003-cases.md`, `specs/backend/BE-004-contracts.md`, `specs/backend/BE-006-deadlines-tasks.md`, `specs/backend/BE-008-activity-outbox.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create `require_version` and atomic version increment helpers without decorators that hide writes.
2. Create IdempotencyRecord with hashed key, scope, request hash, safe bounded response.
3. Implement begin/complete helpers or explicit service functions.
4. Return 409 for stale version and conflicting key reuse.
5. Add concurrency/replay tests.

## Acceptance criteria

- [ ] Helpers remain plain functions within size limits.
- [ ] Same key+request returns prior result; same key+different request returns 409.
- [ ] Keys are not stored in plaintext if avoidable.
- [ ] No generic command framework is added.

## Verification commands

```bash
cd backend && python -m pytest common/tests apps/activity/tests -q
```

## Out of scope

- Applying idempotency to every endpoint.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
