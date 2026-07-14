# BE-022: Implement Channels user event stream and publishing

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-009, BE-007
Depends on: BE-010, BE-019, BE-021

## Goal

Create one secure user-scoped WebSocket consumer and status publishing path.

## Allowed scope

- `backend/common/realtime/`
- `backend/config/asgi.py`
- `backend/config/routing.py`
- `backend/common/realtime/tests/`
- `docs/tech/asyncapi.yaml`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-009-notifications-realtime.md`, `specs/backend/BE-007-documents-uploads.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement `CommonJsonConsumer` with one direct framework base.
2. Implement `UserEventsConsumer` that atomically consumes one-time ticket and joins only user group.
3. Validate origin, ensure ticket values are not logged, and limit incoming messages to ping behavior.
4. Implement small publisher function called by outbox/task processing.
5. Emit versioned upload status events with safe payload.
6. Add ticket reuse, expiry, cross-user, origin, and schema tests.

## Acceptance criteria

- [ ] Client cannot select group names.
- [ ] Ticket is deleted on first use.
- [ ] No JWT/presigned URL appears in event or logs.
- [ ] REST polling remains possible.
- [ ] Consumer has no multiple inheritance.

## Verification commands

```bash
cd backend && python -m pytest common/realtime/tests -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Browser reconnect implementation.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
