# FE-016: Implement activity list and matter timeline presentation

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-009
Depends on: FE-007, FE-008, FE-010, BE-026

## Goal

Render permission-scoped activity with safe localized action mappings.

## Allowed scope

- `frontend/src/features/activity/`
- `frontend/src/features/*/components/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-009-notifications-activity-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write activity API functions and filters.
2. Implement global route for allowed roles.
3. Implement reusable visual timeline component with explicit safe action mapping.
4. Do not render raw diff JSON; map reviewed fields.
5. Handle not-visible and empty states.
6. Add tests.

## Acceptance criteria

- [ ] Hidden matter activity is not inferred.
- [ ] Raw sensitive JSON is not displayed.
- [ ] Action labels localize.
- [ ] Timeline component remains visual, not a domain engine.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/activity
cd frontend && npm run typecheck
```

## Out of scope

- Audit export.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
