# FE-015: Implement notification center and preferences

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-009
Depends on: FE-013, BE-023

## Goal

Deliver in-app list/read behavior and own configurable channel preferences.

## Allowed scope

- `frontend/src/features/notifications/`
- `frontend/src/app/routes.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-009-notifications-activity-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write notification/preference API functions.
2. Implement unread badge/list/read-one/read-all.
3. React to `notification.created` by targeted invalidation.
4. Implement event/channel preference form.
5. Show unavailable provider status truthfully.
6. Add recipient-only and error tests.

## Acceptance criteria

- [x] No other-user preference input exists.
- [x] Disabled/unconfigured channels display correctly.
- [x] Realtime remains a hint and API is authoritative.
- [x] No notification raw legal content is rendered unexpectedly.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/notifications
cd frontend && npm run typecheck
```

## Out of scope

- Provider registration UX.

## Codex execution log

- Started: 2026-07-14 22:08 +0330
- Completed: 2026-07-14 22:12 +0330
- Files changed: `frontend/src/app/routes.tsx`; `frontend/src/features/notifications/api.ts`; `frontend/src/features/notifications/hooks.ts`; `frontend/src/features/notifications/index.ts`; `frontend/src/features/notifications/notificationRealtime.ts`; `frontend/src/features/notifications/notifications.css`; `frontend/src/features/notifications/options.ts`; `frontend/src/features/notifications/queryKeys.ts`; `frontend/src/features/notifications/types.ts`; `frontend/src/features/notifications/components/NotificationList.tsx`; `frontend/src/features/notifications/components/NotificationPreferenceForm.tsx`; `frontend/src/features/notifications/pages/NotificationCenterPage.tsx`; `frontend/src/features/notifications/pages/NotificationPreferencesPage.tsx`; `frontend/src/features/notifications/pages/index.ts`; `frontend/src/features/notifications/tests/api.test.ts`; `frontend/src/features/notifications/tests/pages.test.tsx`; `frontend/src/features/notifications/tests/realtime.test.ts`; `tasks/frontend/FE-015-implement-notification-center-and-preferences.md`; `AI_USAGE.md`.
- Commands run: `cd frontend && npm ci` (restored locked dependencies); `cd frontend && npx prettier --write src/app/routes.tsx src/features/notifications` (passed); `cd frontend && npm test -- --run src/features/notifications` (initially failed on duplicate test text query; passed after test fix, 3 files/8 tests); `cd frontend && npm run typecheck` (initially failed on strict mock tuple indexing; passed after test fix); `python3 scripts/check_simplicity.py frontend/src/features/notifications frontend/src/app/routes.tsx` (passed); `python3 scripts/validate_docs.py` (failed on unrelated task-doc issues outside FE-015).
- Result: Implemented notification list/unread/read/read-all, own preference editing, provider availability messaging, notification-created realtime invalidation hints, and protected routes for `/notifications` and `/settings/notifications`.
- Deviations/questions: FE-015 requires `notification.created` handling but its allowed scope excludes `frontend/src/realtime/`, whose existing client only forwards document upload events. To honor the allowed scope, notification pages use a page-scoped notification realtime listener in `frontend/src/features/notifications/notificationRealtime.ts`; events remain hints and REST queries remain authoritative. Docs validation remains blocked outside this task by invalid/missing task-doc metadata in BE-036, BE-037, FE-022, FE-023, and a missing BE-036 dependency reference.
