# BE-019: Implement ActivityLog and transactional outbox

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-008
Depends on: BE-012

## Goal

Create append-only activity and durable outbox records plus explicit service functions.

## Allowed scope

- `backend/apps/activity/`
- `backend/common/services/`
- `backend/apps/activity/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-008-activity-outbox.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create ActivityLog and OutboxEvent models with safe fields and indexes.
2. Implement explicit action constants and redaction allowlist.
3. Implement `record_activity` and `create_outbox_event` functions.
4. Implement idempotent Celery outbox dispatcher with bounded retry.
5. Add rollback, duplicate dispatch, redaction, and append-only tests.

## Acceptance criteria

- [ ] No signal or event registry is used.
- [ ] Business rollback also removes activity/outbox.
- [ ] Activity cannot be mutated through API.
- [ ] Payloads contain identifiers and safe fields only.
- [ ] Duplicate dispatcher execution does not duplicate effects.

## Verification commands

```bash
cd backend && python -m pytest apps/activity/tests -q
```

## Out of scope

- Notification recipient logic and activity API.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
