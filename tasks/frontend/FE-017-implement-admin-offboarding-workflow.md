# FE-017: Implement Admin offboarding workflow

Status: DONE
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

- [x] Non-Admin route/action is absent and backend denial safe.
- [x] Preview is not presented as completed mutation.
- [x] Duplicate submit/retry cannot create second logical execution.
- [x] Stale preview returns to preview step.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/offboarding
cd frontend && npm run typecheck
```

## Out of scope

- HR directory integration.

## Codex execution log

- Started: 2026-07-15 14:55 +0330
- Completed: 2026-07-15 15:00 +0330
- Files changed:
  - `frontend/src/features/offboarding/api.ts`
  - `frontend/src/features/offboarding/hooks.ts`
  - `frontend/src/features/offboarding/types.ts`
  - `frontend/src/features/offboarding/text.ts`
  - `frontend/src/features/offboarding/index.ts`
  - `frontend/src/features/offboarding/offboarding.css`
  - `frontend/src/features/offboarding/components/OffboardingPanels.tsx`
  - `frontend/src/features/offboarding/pages/AdminOffboardingPage.tsx`
  - `frontend/src/features/offboarding/tests/AdminOffboardingPage.test.tsx`
  - `frontend/src/app/routes.tsx`
  - `tasks/frontend/FE-017-implement-admin-offboarding-workflow.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm test -- --run src/features/offboarding` initially failed before dependency install because `vitest` was unavailable.
  - `cd frontend && npm ci` passed, restoring locked frontend dependencies.
  - `cd frontend && npm test -- --run src/features/offboarding` failed while tightening new test queries around duplicated select options and exact copy.
  - `cd frontend && npm run typecheck` failed on an unused test import and typed UUID mock, then passed after fixes.
  - `cd frontend && npm test -- --run src/features/offboarding` passed, 1 file and 6 tests.
  - `cd frontend && npm run typecheck` passed.
  - `cd frontend && npm run format:check` initially reported style issues in new/changed frontend files.
  - `cd frontend && npx prettier --write src/app/routes.tsx src/features/offboarding/components/OffboardingPanels.tsx src/features/offboarding/hooks.ts src/features/offboarding/pages/AdminOffboardingPage.tsx src/features/offboarding/tests/AdminOffboardingPage.test.tsx src/features/offboarding/text.ts src/features/offboarding/api.ts src/features/offboarding/types.ts src/features/offboarding/offboarding.css src/features/offboarding/index.ts` passed.
  - `cd frontend && npm test -- --run src/features/offboarding` passed after formatting, 1 file and 6 tests.
  - `cd frontend && npm run typecheck` passed after formatting.
  - `cd frontend && npm run format:check` passed.
  - `cd frontend && npx eslint src/features/offboarding src/app/routes.tsx --max-warnings=0` passed.
  - `python3 scripts/check_simplicity.py frontend/src/features/offboarding frontend/src/app/routes.tsx` passed, scanned 8 source files.
- Result: Added an explicit Admin-only offboarding workflow with active member selection, read-only preview, affected matters/tasks/deadlines/access/warnings presentation, explicit `OFFBOARD` confirmation, stable idempotency-key reuse for execute retry, duplicate-submit prevention, stale-preview reset on `409 offboarding_preview_stale`, final run status, and safe permission/rate-limit/network messaging.
- Deviations/questions: The task lists `frontend/src/app/routes.ts`, but this repository uses `frontend/src/app/routes.tsx`; the real route file was updated. Localized labels were kept feature-local to stay inside FE-017's allowed scope.
