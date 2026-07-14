# BE-024: Implement deadline reminder scheduling

Status: DONE
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

- [x] Repeated scans create no duplicate delivery.
- [x] Completed/cancelled deadline produces no reminder.
- [x] Preference disabled channel is respected.
- [x] Scan does not call providers directly.

## Verification commands

```bash
cd backend && python -m pytest apps/deadlines/tests apps/notifications/tests -q
```

## Out of scope

- Escalation chains or workflow designer.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 21:48:37 +0330
- Files changed:
  - `backend/apps/deadlines/services.py`
  - `backend/apps/deadlines/tasks.py`
  - `backend/apps/deadlines/tests/test_reminders.py`
  - `backend/config/celery.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-024-implement-deadline-reminder-scheduling.md`
- Commands run:
  - `cd backend && python -m pytest apps/deadlines/tests apps/notifications/tests -q` (failed before pytest because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be024-venv uv run --python /usr/bin/python3.12 python -m pytest apps/deadlines/tests apps/notifications/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be024-venv uv run --python /usr/bin/python3.12 ruff format apps/deadlines/services.py apps/deadlines/tasks.py apps/deadlines/tests/test_reminders.py config/celery.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be024-venv uv run --python /usr/bin/python3.12 ruff check apps/deadlines/services.py apps/deadlines/tasks.py apps/deadlines/tests/test_reminders.py config/celery.py`
  - `python scripts/check_simplicity.py backend` (failed before script startup because `.python-version` points to uninstalled `3.12`)
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `python3 scripts/check_simplicity.py backend`
  - `python3 scripts/validate_docs.py`
- Result: DONE; implemented fixed 24-hour and 1-hour reminder windows, bounded open-deadline scans, notification/delivery intent creation through the notification service, stable per-deadline/recipient/offset/channel dedupe, a Celery task entry point, a 5-minute Celery Beat schedule, and tests for repeated scans, final-state exclusion, disabled preferences, provider-call avoidance, timezone boundary behavior, and task invocation.
- Deviations/questions: The literal verification commands that use `python` cannot start in this workspace because pyenv points to an uninstalled `3.12`; the same targets passed with `/usr/bin/python3.12`/`python3`.
