# INT-005: Verify notifications, activity, and dashboard

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-008, BE-009, BE-010, FE-008, FE-009
Depends on: BE-025, FE-016

## Goal

Verify preference-respecting notifications, activity visibility, and dashboard count parity.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-008-activity-outbox.md`
- `specs/backend/BE-009-notifications-realtime.md`
- `specs/backend/BE-010-dashboard.md`
- `specs/frontend/FE-008-dashboard.md`
- `specs/frontend/FE-009-notifications-activity-realtime.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Trigger deadline/record events.
2. Verify in-app and email development delivery, disabled channel behavior, and no fake SMS/push success.
3. Verify activity timeline/global visibility.
4. Compare dashboard counts with list APIs per role.

## Acceptance criteria

- [ ] No duplicate delivery.
- [ ] Dashboard leaks no hidden counts.
- [ ] Activity is read-only and redacted.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_dashboard_notifications.py -q
```

## Out of scope

- Production provider delivery.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
