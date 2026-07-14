# FE-014: Implement dashboard

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-008
Depends on: FE-007, FE-008, FE-009, FE-010, FE-011, BE-025

## Goal

Render permission-aware workload summary and pre-filtered links.

## Allowed scope

- `frontend/src/features/dashboard/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-008-dashboard.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write dashboard API/query.
2. Render case/contract/notice/deadline/task/activity sections.
3. Link cards to explicit filter routes.
4. Add loading/empty/error/429 states.
5. Use accessible urgency indicators and RTL-compatible layout.
6. Add tests.

## Acceptance criteria

- [ ] No client-generated hidden total.
- [ ] Links preserve filters.
- [ ] Urgency is not color-only.
- [ ] Role-specific wording is accurate.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/dashboard
cd frontend && npm run typecheck
```

## Out of scope

- Charts/analytics.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
