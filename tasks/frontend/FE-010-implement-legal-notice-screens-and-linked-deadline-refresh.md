# FE-010: Implement legal notice screens and linked deadline refresh

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-005
Depends on: FE-007, FE-009, BE-016

## Goal

Deliver notice intake, related matter selection, detail, update, archive, and linked deadline refresh.

## Allowed scope

- `frontend/src/features/notices/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-005-notices.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write notice API functions.
2. Implement list/detail/form with received and response dates.
3. Implement permission-scoped related matter search using explicit case/contract APIs.
4. On mutation invalidate notice and deadline queries.
5. Handle invalid date, hidden relation, version conflict, and archive.
6. Add tests.

## Acceptance criteria

- [ ] Invisible relation choices never appear.
- [ ] Linked deadline refreshes after notice update.
- [ ] Date and permission errors are clear.
- [ ] No generic relation UI is created.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/notices
cd frontend && npm run typecheck
```

## Out of scope

- Advanced response workflow.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
