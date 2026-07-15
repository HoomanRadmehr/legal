# FE-016: Implement activity list and matter timeline presentation

Status: DONE
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

- [x] Hidden matter activity is not inferred.
- [x] Raw sensitive JSON is not displayed.
- [x] Action labels localize.
- [x] Timeline component remains visual, not a domain engine.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/activity
cd frontend && npm run typecheck
```

## Out of scope

- Audit export.

## Codex execution log

- Started: 2026-07-15 14:48 +0330
- Completed: 2026-07-15 14:52 +0330
- Files changed:
  - `frontend/src/features/activity/api.ts`
  - `frontend/src/features/activity/hooks.ts`
  - `frontend/src/features/activity/types.ts`
  - `frontend/src/features/activity/activityLabels.ts`
  - `frontend/src/features/activity/text.ts`
  - `frontend/src/features/activity/activity.css`
  - `frontend/src/features/activity/index.ts`
  - `frontend/src/features/activity/components/ActivityFilters.tsx`
  - `frontend/src/features/activity/components/ActivityTimeline.tsx`
  - `frontend/src/features/activity/pages/ActivityListPage.tsx`
  - `frontend/src/features/activity/tests/ActivityPage.test.tsx`
  - `frontend/src/features/cases/components/CaseTimeline.tsx`
  - `frontend/src/features/contracts/components/ContractTimeline.tsx`
  - `frontend/src/features/notices/components/NoticeTimeline.tsx`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-016-implement-activity-list-and-matter-timeline-presentation.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm test -- --run src/features/activity` initially failed before dependency install because `vitest` was unavailable.
  - `cd frontend && npm ci` passed, restoring locked frontend dependencies.
  - `cd frontend && npm test -- --run src/features/activity` passed, 1 file and 5 tests.
  - `cd frontend && npm run typecheck` passed after typing mocked fetch call helpers.
  - `cd frontend && npm run format:check` passed after targeted Prettier formatting.
  - `cd frontend && npx eslint src/features/activity src/features/cases/components/CaseTimeline.tsx src/features/contracts/components/ContractTimeline.tsx src/features/notices/components/NoticeTimeline.tsx src/app/routes.tsx --max-warnings=0` passed.
  - `python3 scripts/check_simplicity.py frontend/src/features/activity frontend/src/features/cases/components/CaseTimeline.tsx frontend/src/features/contracts/components/ContractTimeline.tsx frontend/src/features/notices/components/NoticeTimeline.tsx frontend/src/app/routes.tsx` passed, scanned 10 source files.
- Result: Added the explicit activity feature with typed activity and matter timeline API functions, filters, query hooks, a permission-aware `/activity` page, safe localized action labels, reviewed field presentation only, 403/404/429 states, and a small visual timeline component reused by case, contract, and notice timeline components.
- Deviations/questions: The task allowed `frontend/src/features/activity/` and `frontend/src/features/*/components/`, but implementing the required global route also required `frontend/src/app/routes.tsx`. Localized activity copy was kept feature-local instead of expanding shared i18n resources.
