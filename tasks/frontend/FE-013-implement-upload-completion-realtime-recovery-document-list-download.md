# FE-013: Implement upload completion, realtime recovery, document list/download

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-007, FE-009
Depends on: FE-012, FE-004, BE-021, BE-022

## Goal

Complete uploads idempotently, follow authoritative status over WebSocket/polling, and download through fresh backend URLs.

## Allowed scope

- `frontend/src/features/documents/`
- `frontend/src/realtime/`
- `frontend/src/auth/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-007-documents-upload.md`, `specs/frontend/FE-009-notifications-activity-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement completion request reusing idempotency key.
2. Implement one-time WS ticket client and user connection with backoff.
3. Validate event envelope/version and update/invalidate upload queries.
4. Poll active uploads while disconnected and refetch on reconnect.
5. Implement document list, status, fresh download URL, and revoke control.
6. Add state/recovery/security tests.

## Acceptance criteria

- [ ] Ticket/token/URL is not persisted.
- [ ] Duplicate event cannot regress final state.
- [ ] Polling reaches same final state.
- [ ] Download asks backend each time.
- [ ] Unknown event version is safe.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/documents src/realtime
cd frontend && npm run typecheck
```

## Out of scope

- Other realtime event features.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
