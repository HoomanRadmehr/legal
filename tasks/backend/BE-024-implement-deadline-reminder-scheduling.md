# BE-024: Implement deadline reminder scheduling

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-006, BE-009
Depends on: BE-015, BE-023

## Goal

Scan reminder windows and create deduplicated delivery intent without sending inside the scan transaction.

## Allowed scope

- `backend/apps/deadlines/tasks.py`
- `backend/apps/deadlines/services.py`
- `backend/config/celery.py`
- `backend/apps/deadlines/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-006-deadlines-tasks.md`, `specs/backend/BE-009-notifications-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Define a simple reminder offset policy and preference lookup.
2. Implement bounded indexed scan for open deadlines entering windows.
3. Create Notification/Delivery rows with stable dedupe keys.
4. Configure Celery Beat schedule and one task entry point.
5. Test repeated scans and timezone boundaries.

## Acceptance criteria

- [ ] Repeated scans create no duplicate delivery.
- [ ] Completed/cancelled deadline produces no reminder.
- [ ] Preference disabled channel is respected.
- [ ] Scan does not call providers directly.

## Verification commands

```bash
cd backend && python -m pytest apps/deadlines/tests apps/notifications/tests -q
```

## Out of scope

- Escalation chains or workflow designer.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
