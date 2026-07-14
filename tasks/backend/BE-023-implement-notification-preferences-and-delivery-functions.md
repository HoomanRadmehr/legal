# BE-023: Implement notification preferences and delivery functions

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-009
Depends on: BE-019, BE-022, BE-008

## Goal

Create recipient-scoped notifications, user-configurable channels, and explicit delivery dispatch functions.

## Allowed scope

- `backend/apps/notifications/`
- `backend/apps/notifications/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-009-notifications-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create NotificationPreference, Notification, and NotificationDelivery models.
2. Implement own-preference list/replace service.
3. Implement recipient/delivery creation with unique dedupe key.
4. Implement explicit in_app/email/sms/push functions and `if` dispatch.
5. Mark unconfigured SMS/push as skipped with safe code.
6. Publish in-app event after notification persists.
7. Add APIs, OpenAPI, and tests.

## Acceptance criteria

- [ ] Users cannot modify another user preferences.
- [ ] No abstract channel class or registry exists.
- [ ] Disabled/unconfigured channel status is truthful.
- [ ] Duplicate delivery intent is blocked.
- [ ] Provider secrets and raw responses are not stored/logged.

## Verification commands

```bash
cd backend && python -m pytest apps/notifications/tests -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Provider-specific production SDK integration unless credentials are available.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
