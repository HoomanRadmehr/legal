# FE-017: Implement Admin offboarding workflow

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-010
Depends on: FE-005, BE-027

## Goal

Create preview-confirm-execute flow with stable idempotency and stale-preview recovery.

## Allowed scope

- `frontend/src/features/offboarding/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-010-offboarding.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Admin-only route/navigation.
2. Implement member selection and preview request.
3. Render affected matters/tasks/deadlines/access/warnings.
4. Require explicit confirmation.
5. Generate one idempotency key per logical execute and reuse on retry.
6. Handle stale preview 409 and final result.
7. Prevent double submit; add tests.

## Acceptance criteria

- [ ] Non-Admin route/action is absent and backend denial safe.
- [ ] Preview is not presented as completed mutation.
- [ ] Duplicate submit/retry cannot create second logical execution.
- [ ] Stale preview returns to preview step.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/offboarding
cd frontend && npm run typecheck
```

## Out of scope

- HR directory integration.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
