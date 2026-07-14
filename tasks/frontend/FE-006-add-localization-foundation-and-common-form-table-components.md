# FE-006: Add localization foundation and common form/table components

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-000, FE-011
Depends on: FE-003

## Goal

Create English/Persian translation setup, direction control, and a small set of visual shared components.

## Allowed scope

- `frontend/src/i18n/`
- `frontend/src/components/`
- `frontend/src/app/providers.tsx`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-000-foundation.md`, `specs/frontend/FE-011-localization-accessibility.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Configure i18next namespaces and Accept-Language integration.
2. Switch document direction for en/fa.
3. Create only common page header, paginated table shell, status badge, confirmation dialog, and form error summary.
4. Ensure components are visual and domain-neutral.
5. Add basic RTL and accessibility tests.

## Acceptance criteria

- [x] No missing key in common shell.
- [x] Technical identifiers can opt into direction isolation.
- [x] Shared components contain no domain API/business logic.

## Verification commands

```bash
cd frontend && npm test -- --run src/i18n src/components
cd frontend && npm run typecheck
```

## Out of scope

- Full Jalali feature integration.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `frontend/src/app/providers.tsx`
  - `frontend/src/i18n/config.ts`
  - `frontend/src/i18n/context.ts`
  - `frontend/src/i18n/I18nProvider.tsx`
  - `frontend/src/i18n/index.ts`
  - `frontend/src/i18n/resources.ts`
  - `frontend/src/i18n/i18n.test.tsx`
  - `frontend/src/components/commonComponents.test.tsx`
  - `frontend/src/components/components.css`
  - `frontend/src/components/confirmationDialog.tsx`
  - `frontend/src/components/formErrorSummary.tsx`
  - `frontend/src/components/pageHeader.tsx`
  - `frontend/src/components/paginatedTable.tsx`
  - `frontend/src/components/statusBadge.tsx`
  - `frontend/src/components/technicalValue.tsx`
  - `tasks/frontend/FE-006-add-localization-foundation-and-common-form-table-components.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm ci`
  - `cd frontend && npm run format`
  - `cd frontend && npm test -- --run src/i18n src/components`
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run format:check`
  - `cd frontend && npm run build`
  - `/usr/bin/python3 scripts/check_simplicity.py frontend`
  - `/usr/bin/python3 scripts/validate_docs.py`
- Result: Passed. Required i18n/component test run covered 3 files and 13 tests; frontend simplicity check scanned 36 source files.
- Deviations/questions: `Accept-Language` integration is exposed as an i18n helper because this task's allowed scope excludes `src/api/client.ts`; future handwritten API functions can pass that header through the FE-002 client. No unresolved questions remain.
