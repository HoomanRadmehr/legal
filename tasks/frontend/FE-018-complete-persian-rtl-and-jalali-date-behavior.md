# FE-018: Complete Persian RTL and Jalali date behavior

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-011
Depends on: FE-006, FE-007, FE-008, FE-009, FE-010, FE-011, FE-014, FE-015, FE-016, FE-017

## Goal

Apply English/Persian translations, RTL, direction isolation, and Jalali/ISO conversion to all P0 screens.

## Allowed scope

- `frontend/src/i18n/`
- `frontend/src/features/`
- `frontend/src/components/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-011-localization-accessibility.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Complete translation keys for P0 flows.
2. Integrate Jalali date input/display into case/contract/notice/deadline/task forms.
3. Send ISO dates/timestamps only.
4. Audit RTL layout and technical identifier direction.
5. Add conversion boundary and missing-key tests.

## Acceptance criteria

- [ ] No missing P0 translation keys.
- [ ] Jalali values round-trip without date shift.
- [ ] Canonical API enums remain unchanged.
- [ ] English LTR and Persian RTL critical flows are usable.

## Verification commands

```bash
cd frontend && npm test -- --run src/i18n src/features
cd frontend && npm run typecheck
```

## Out of scope

- Non-P0 content translation.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
