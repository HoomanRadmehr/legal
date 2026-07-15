# FE-024: Implement organization user role management page

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-001, FE-002, FE-011, FE-012
Depends on: FE-002, FE-004, FE-005, FE-006, BE-038

## Goal

Allow a Legal Admin to:

1. View users in their current organization.
2. Filter the user list.
3. Change an active Membership's role.
4. Receive clear feedback for:
   - last Legal Admin protection,
   - stale or conflicting role changes,
   - permission failures,
   - rate limits,
   - network failures.
5. Immediately refresh frontend permissions after changing their own role.

The page must remain explicit and easy to review.

Do not create a generic user-management, table, form, permission, or workflow framework.

## Route

```text
/admin/users
```

## API contract

```text
GET /api/v1/memberships/
POST /api/v1/memberships/{id}/role/
```

Role values stay canonical:

```text
legal_admin
legal_manager
legal_counsel
viewer
```

## Allowed scope

- `frontend/src/features/adminUsers/`
- `frontend/src/app/routes.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/AppShell.test.tsx`
- `frontend/src/auth/context.ts`
- `frontend/src/auth/AuthProvider.tsx`
- `frontend/src/i18n/resources.ts`
- `tasks/frontend/FE-024-implement-user-role-management-page.md`
- `AI_USAGE.md`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md`
- `specs/frontend/FE-001-authentication.md`
- `specs/frontend/FE-002-app-shell-permissions.md`
- `specs/frontend/FE-011-localization-accessibility.md`
- `specs/frontend/FE-012-testing-delivery.md`
- `tasks/backend/BE-038-implement-membership-role-management.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Add explicit membership list and role-change API functions.
2. Add a Legal Admin-only `/admin/users` page with search and role filtering.
3. Add per-user role controls using canonical role values.
4. Map last-admin, stale/conflict, permission, rate-limit, and network failures to safe messages.
5. Refresh the current frontend session after changing the current user's own role.
6. Add focused tests for permissions, filters, payloads, errors, self-role refresh, and Persian RTL rendering.

## Acceptance criteria

- [x] Only Legal Admin users can view the role-management page.
- [x] The page lists current-organization memberships returned by the backend.
- [x] Search and role filters narrow the visible user list.
- [x] Role changes submit only the selected canonical role to `/memberships/{id}/role/`.
- [x] Last Legal Admin protection shows a clear `409` message.
- [x] Other role-change conflicts show a stale/latest-state message.
- [x] Permission, rate-limit, and network failures show safe messages.
- [x] Changing the current user's own role refreshes frontend permissions immediately.
- [x] English and Persian labels render, with canonical API role values preserved.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/adminUsers src/components/layout/AppShell.test.tsx
cd frontend && npm run typecheck
cd frontend && npm run format:check
cd frontend && npm run lint
cd frontend && npx eslint src/features/adminUsers src/app/routes.tsx src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx src/auth/context.ts src/auth/AuthProvider.tsx src/i18n/resources.ts --max-warnings=0
cd frontend && npm run build
python3 scripts/check_simplicity.py frontend/src/features/adminUsers frontend/src/app/routes.tsx frontend/src/components/layout/AppShell.tsx frontend/src/auth/context.ts frontend/src/auth/AuthProvider.tsx frontend/src/i18n/resources.ts
python3 scripts/validate_docs.py
```

## Out of scope

- Backend role-management behavior.
- User invitation creation or acceptance.
- Offboarding execution.
- Generic CRUD/user-management frameworks.

## Codex execution log

- Started: 2026-07-15 12:10 +0330
- Deviations/questions: The original task file was truncated after the route code fence. It referenced `FE-022`, but the implemented backend dependency for this frontend page is the membership role-management API in `tasks/backend/BE-038-implement-membership-role-management.md`.
- Completed: 2026-07-15 12:18 +0330
- Files changed:
  - `frontend/src/features/adminUsers/api.ts`
  - `frontend/src/features/adminUsers/hooks.ts`
  - `frontend/src/features/adminUsers/types.ts`
  - `frontend/src/features/adminUsers/index.ts`
  - `frontend/src/features/adminUsers/pages/AdminUserManagementPage.tsx`
  - `frontend/src/features/adminUsers/pages/index.ts`
  - `frontend/src/features/adminUsers/tests/AdminUserManagementPage.test.tsx`
  - `frontend/src/features/adminUsers/adminUsers.css`
  - `frontend/src/app/routes.tsx`
  - `frontend/src/components/layout/AppShell.tsx`
  - `frontend/src/components/layout/AppShell.test.tsx`
  - `frontend/src/auth/context.ts`
  - `frontend/src/auth/AuthProvider.tsx`
  - `frontend/src/i18n/resources.ts`
  - `tasks/frontend/FE-024-implement-user-role-management-page.md`
  - `AI_USAGE.md`
- Tests and verification:
  - `cd frontend && npm test -- --run src/features/adminUsers src/components/layout/AppShell.test.tsx` passed, 3 files and 17 tests.
  - `cd frontend && npm run typecheck` passed.
  - `cd frontend && npm run format:check` passed after targeted Prettier formatting.
  - `cd frontend && npm run lint` failed on existing `frontend/src/features/notifications/components/NotificationPreferenceForm.tsx` `react-hooks/set-state-in-effect`, outside FE-024 allowed scope.
  - `cd frontend && npx eslint src/features/adminUsers src/app/routes.tsx src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx src/auth/context.ts src/auth/AuthProvider.tsx src/i18n/resources.ts --max-warnings=0` passed.
  - `cd frontend && npm run build` passed with Vite's large chunk warning.
  - `python3 scripts/check_simplicity.py frontend/src/features/adminUsers frontend/src/app/routes.tsx frontend/src/components/layout/AppShell.tsx frontend/src/auth/context.ts frontend/src/auth/AuthProvider.tsx frontend/src/i18n/resources.ts` passed, scanned 10 source files.
  - `python3 scripts/validate_docs.py` failed after generated dependency/build cleanup on existing decimal task ID headings, including this task ID format and prior decimal task files.
- Result: Added an explicit Legal Admin-only `/admin/users` role-management page, typed membership list and role-change API functions, canonical role selects, client search/role filters, safe error messages for last-admin/stale/permission/rate-limit/network failures, self-role session refresh, English/Persian copy, and focused tests.
