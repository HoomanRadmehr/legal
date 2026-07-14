# BE-027: Implement offboarding preview and atomic execute

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-011
Depends on: BE-008, BE-012, BE-015, BE-017, BE-018, BE-019, BE-023

## Goal

Provide Admin-only preview and idempotent atomic transfer of owned/assigned work.

## Allowed scope

- `backend/apps/offboarding/`
- `backend/apps/matters/services.py`
- `backend/apps/offboarding/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-011-offboarding.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create OffboardingRun model.
2. Implement preview selector with safe affected records and fingerprint.
3. Implement execute service with role check, same-org active replacement, lock order, idempotency, stale preview check.
4. Reassign matters/open tasks/open deadlines, revoke grants, deactivate membership, activity/outbox in one transaction.
5. Add APIs, OpenAPI, and rollback tests.

## Acceptance criteria

- [ ] Preview has no mutations.
- [ ] Only Admin can call endpoints.
- [ ] Any stage failure rolls back all data.
- [ ] No active matter remains owned by departed member.
- [ ] Matching replay is safe; conflicting/stale request returns 409.

## Verification commands

```bash
cd backend && python -m pytest apps/offboarding/tests -q
```

## Out of scope

- HR integrations or multi-stage approval.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
