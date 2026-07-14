# FE-015: Implement notification center and preferences

Status: TODO
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

- [ ] No other-user preference input exists.
- [ ] Disabled/unconfigured channels display correctly.
- [ ] Realtime remains a hint and API is authoritative.
- [ ] No notification raw legal content is rendered unexpectedly.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/notifications
cd frontend && npm run typecheck
```

## Out of scope

- Provider registration UX.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
