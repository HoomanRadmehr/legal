# FE-019: Run frontend security and accessibility verification

Status: DONE
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

- Started: 2026-07-15 17:54 +0330
- Completed: 2026-07-15 17:58 +0330
- Files changed:
  - `frontend/src/auth/session.test.ts`
  - `frontend/src/components/commonComponents.test.tsx`
  - `frontend/src/components/localizedDateInput.tsx`
  - `frontend/src/features/deadlines/tests/DeadlinePages.test.tsx`
  - `frontend/src/features/documents/tests/DocumentUploadPanel.test.tsx`
  - `frontend/src/features/documents/tests/DocumentSection.test.tsx`
  - `frontend/src/features/documents/tests/recovery.test.ts`
  - `frontend/src/features/notifications/components/NotificationPreferenceForm.tsx`
  - `frontend/src/realtime/client.test.ts`
  - `tasks/frontend/FE-019-run-frontend-security-and-accessibility-verification.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm run lint` (initially failed on `react-hooks/set-state-in-effect`; passed after minimal confirmed source fixes)
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm test -- --run` (initially failed on the new tab-focus assumption; passed after correcting the test)
  - `python3 scripts/check_simplicity.py frontend/src`
- Result: Added explicit frontend security and accessibility verification for refresh retry secrecy, token/presigned URL non-persistence, direct-transfer console secrecy, realtime reconnect/unknown-message handling, polling fallback guidance, upload event boundaries, keyboardable deadline tabs, and non-color status labels. Required lint, typecheck, and full test suite passed.
- Deviations/questions: FE-019 allowed scope lists test files only, but its required `npm run lint` command failed on source files and implementation step 6 says to fix confirmed issues. Minimal source fixes were made in `localizedDateInput.tsx` and `NotificationPreferenceForm.tsx` to remove synchronous state updates inside effects without redesign.
