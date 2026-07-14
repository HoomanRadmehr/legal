# BE-030: Run focused backend security test suite

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-009, BE-011, BE-013, BE-014, BE-016, BE-015, BE-017, BE-021, BE-022, BE-027

## Goal

Add and pass an explicit security suite covering the highest-risk boundaries.

## Allowed scope

- `backend/tests/security/`
- `backend/apps/*/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Add cross-organization list/retrieve/update/download tests.
2. Add role mutation matrix.
3. Add JWT rotation/replay/logout/CSRF tests.
4. Add rate-limit tests.
5. Add upload mismatch/expiry/replay/log redaction tests.
6. Add WS ticket reuse/cross-user/origin tests.
7. Add offboarding rollback/idempotency tests.
8. Run full suite and fix confirmed issues only.

## Acceptance criteria

- [ ] Every security scenario in docs/guardrails/02-security.md is covered or explicitly documented as deferred.
- [ ] No test is weakened to accommodate incorrect behavior.
- [ ] Full backend suite passes.

## Verification commands

```bash
cd backend && python -m pytest tests/security apps -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Penetration testing claim or production certification.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
