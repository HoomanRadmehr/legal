# INT-007: Verify Persian locale, RTL, and Jalali dates

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-012, FE-011
Depends on: BE-028, FE-018

## Goal

Verify localized API messages and end-to-end Jalali date round-trip in critical forms.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-012-api-localization.md`
- `specs/frontend/FE-011-localization-accessibility.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Switch Persian locale and RTL.
2. Create contract/notice/deadline with Jalali input.
3. Verify ISO backend storage/response.
4. Reload and compare displayed Jalali date.
5. Verify canonical status codes unchanged.

## Acceptance criteria

- [ ] No date shift.
- [ ] RTL critical flows are usable.
- [ ] Localized messages and canonical values behave as specified.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_localization.py -q
```

## Out of scope

- Full translation QA.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
