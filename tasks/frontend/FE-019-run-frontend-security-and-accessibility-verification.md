# FE-019: Run frontend security and accessibility verification

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-012
Depends on: FE-004, FE-005, FE-013, FE-017, FE-018

## Goal

Add focused tests for token/URL secrecy, permission UI, retry loops, realtime recovery, and accessible critical flows.

## Allowed scope

- `frontend/src/test/`
- `frontend/src/**/*.test.*`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-012-testing-delivery.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Test no access token/presigned URL in browser persistence or console mocks.
2. Test single-flight refresh and no infinite loop.
3. Test role action matrix and direct denial.
4. Test WS reconnect/unknown event and polling.
5. Test dialogs/forms/tabs/keyboard labels and non-color status.
6. Fix confirmed issues without redesign.

## Acceptance criteria

- [ ] Security scenarios are explicit and pass.
- [ ] No accessibility test is silenced without explanation.
- [ ] No test asserts implementation details instead of user behavior.

## Verification commands

```bash
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm test -- --run
```

## Out of scope

- Claiming formal accessibility certification.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
