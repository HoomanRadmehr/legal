# FE-018: Complete Persian RTL and Jalali date behavior

Status: DONE
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

- [x] No missing P0 translation keys.
- [x] Jalali values round-trip without date shift.
- [x] Canonical API enums remain unchanged.
- [x] English LTR and Persian RTL critical flows are usable.

## Verification commands

```bash
cd frontend && npm test -- --run src/i18n src/features
cd frontend && npm run typecheck
```

## Out of scope

- Non-P0 content translation.

## Codex execution log

- Started: 2026-07-15 17:09 +0330
- Completed: 2026-07-15 17:53 +0330
- Files changed:
  - `frontend/src/i18n/date.ts`
  - `frontend/src/i18n/i18n.test.tsx`
  - `frontend/src/components/localizedDateInput.tsx`
  - `frontend/src/components/components.css`
  - `frontend/src/components/layout/AppShell.tsx`
  - `frontend/src/components/layout/appShell.css`
  - `frontend/src/features/activity/activityLabels.ts`
  - `frontend/src/features/activity/components/ActivityTimeline.tsx`
  - `frontend/src/features/cases/components/CaseForm.tsx`
  - `frontend/src/features/cases/components/CaseSummary.tsx`
  - `frontend/src/features/cases/components/caseLabels.ts`
  - `frontend/src/features/cases/tests/CaseForm.test.tsx`
  - `frontend/src/features/contracts/components/ContractForm.tsx`
  - `frontend/src/features/contracts/components/ContractSummary.tsx`
  - `frontend/src/features/contracts/components/contractLabels.ts`
  - `frontend/src/features/deadlines/components/DeadlineForm.tsx`
  - `frontend/src/features/deadlines/components/DeadlineListTable.tsx`
  - `frontend/src/features/deadlines/components/DeadlineSummary.tsx`
  - `frontend/src/features/deadlines/components/DeadlineViewTabs.tsx`
  - `frontend/src/features/deadlines/components/deadlineLabels.ts`
  - `frontend/src/features/deadlines/tests/DeadlineForm.test.tsx`
  - `frontend/src/features/notices/components/NoticeForm.tsx`
  - `frontend/src/features/notices/components/NoticeListTable.tsx`
  - `frontend/src/features/notices/components/NoticeSummary.tsx`
  - `frontend/src/features/notices/components/noticeLabels.ts`
  - `frontend/src/features/tasks/components/TaskForm.tsx`
  - `frontend/src/features/tasks/components/TaskListTable.tsx`
  - `frontend/src/features/tasks/components/TaskSummary.tsx`
  - `frontend/src/features/tasks/components/taskLabels.ts`
  - `tasks/frontend/FE-018-complete-persian-rtl-and-jalali-date-behavior.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci`
  - `cd frontend && npm test -- --run src/i18n src/features`
  - `cd frontend && npm run typecheck`
  - `python3 scripts/check_simplicity.py frontend/src/i18n frontend/src/components frontend/src/features`
  - `cd frontend && npx prettier --check src/i18n/date.ts src/i18n/i18n.test.tsx src/components/localizedDateInput.tsx src/components/components.css src/components/layout/AppShell.tsx src/components/layout/appShell.css src/features/activity/activityLabels.ts src/features/activity/components/ActivityTimeline.tsx src/features/cases/components/CaseForm.tsx src/features/cases/components/CaseSummary.tsx src/features/cases/components/caseLabels.ts src/features/cases/tests/CaseForm.test.tsx src/features/contracts/components/ContractForm.tsx src/features/contracts/components/ContractSummary.tsx src/features/contracts/components/contractLabels.ts src/features/deadlines/components/DeadlineForm.tsx src/features/deadlines/components/DeadlineListTable.tsx src/features/deadlines/components/DeadlineSummary.tsx src/features/deadlines/components/DeadlineViewTabs.tsx src/features/deadlines/components/deadlineLabels.ts src/features/deadlines/tests/DeadlineForm.test.tsx src/features/notices/components/NoticeForm.tsx src/features/notices/components/NoticeListTable.tsx src/features/notices/components/NoticeSummary.tsx src/features/notices/components/noticeLabels.ts src/features/tasks/components/TaskForm.tsx src/features/tasks/components/TaskListTable.tsx src/features/tasks/components/TaskSummary.tsx src/features/tasks/components/taskLabels.ts`
- Result: Implemented localized Jalali date and datetime input/display boundaries for case, contract, notice, deadline, and task critical flows; added Persian enum/action labels on touched P0 views; kept submitted API dates/timestamps and enum payloads canonical; added conversion and canonical payload tests. Required verification passed: 32 frontend test files and 120 tests, plus TypeScript typecheck.
- Deviations/questions: `docs/tech/09-localization.md` was referenced during discovery but does not exist in this repository; FE-011 and available guardrails were used instead.

### Follow-up: Persian default, RTL shell, and remaining page copy

- Started: 2026-07-15 19:13 +0330
- Completed: 2026-07-15 19:47 +0330
- Files changed:
  - `frontend/src/i18n/config.ts`, `frontend/src/i18n/I18nProvider.tsx`, `frontend/src/i18n/context.ts`, `frontend/src/i18n/index.ts`, `frontend/src/i18n/i18n.test.tsx`
  - `frontend/src/api/client.ts`, `frontend/src/api/client.test.ts`, `frontend/src/auth/AuthProvider.tsx`
  - `frontend/src/components/layout/AppShell.tsx`, `frontend/src/components/layout/appShell.css`, `frontend/src/components/standardStates.tsx`, `frontend/src/components/standardStates.test.tsx`
  - `frontend/src/features/auth/LoginPage.tsx`
  - `frontend/src/features/cases/`, `frontend/src/features/contracts/`, `frontend/src/features/deadlines/`, `frontend/src/features/notices/`, `frontend/src/features/tasks/`
  - `frontend/src/features/documents/`, `frontend/src/features/notifications/`, `frontend/src/features/activity/`, `frontend/src/features/offboarding/`, `frontend/src/features/adminUsers/`
  - affected frontend tests under `frontend/src/**/tests/`
- Commands run:
  - `cd frontend && npm ci`
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
  - `cd frontend && npm test -- --run`
  - `python3 scripts/check_simplicity.py frontend`
  - `python3 scripts/check_simplicity.py`
  - `python3 scripts/validate_docs.py`
  - `rg -n "text-align: left|text-align: right|margin-left|margin-right|padding-left|padding-right|border-left|border-right|left:|right:" frontend/src --glob '*.css'`
- Result: Persian is the frontend default for new/invalid/unsaved locale state; explicit frontend locale persistence stores only `fa` or `en`; authenticated `preferred_language` still has priority without persisting sensitive data; root `html` `lang`/`dir` updates dynamically; API requests receive locale-aware `Accept-Language`; the app shell/sidebar renders RTL with the sidebar on the right in Persian; remaining implemented page/form/list/error text was given Persian presentation copy while canonical API enum/status/identifier values stay unchanged.
- Verification: Full frontend test suite passed, 47 files and 175 tests. Typecheck, lint, production build, frontend and full simplicity checks, docs validation, and the CSS physical-direction scan passed. `npm run build` emitted the existing Vite large-chunk warning. Generated `frontend/node_modules` and `frontend/dist` were removed after verification so repository guard scripts scan source only.
- Deviations/questions: No backend/API behavior changed. No unresolved localization blocker remains for FE-018.
