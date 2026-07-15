# BE-006: Deadlines, reminders, and tasks

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-005, ASSIGN-006, BR-017 through BR-021
- Depends on: BE-002

## Intent

Make critical legal obligations easy to find and update correctly across organization timezones, while supporting simple linked task collaboration.

## Deadline API

```text
GET    /api/v1/deadlines/
POST   /api/v1/deadlines/
GET    /api/v1/deadlines/{id}/
PATCH  /api/v1/deadlines/{id}/
POST   /api/v1/deadlines/{id}/complete/
POST   /api/v1/deadlines/{id}/cancel/
```

List uses a required or optional view parameter:

```text
?view=upcoming
?view=overdue
?view=today
?view=assigned_to_me
```

Additional explicit filters include matter, assignee, status, priority, due range.

## View semantics

- Calculate “today” in `Organization.timezone`.
- `overdue`: open and `due_at < now`.
- `today`: open and local date equals organization current date.
- `upcoming`: open and after now, optionally bounded by a documented horizon.
- `assigned_to_me`: open, assigned to active current membership, and visible through matter permissions.
- Completed/cancelled items are excluded from the special open views unless explicitly filtered otherwise.

## Task API

```text
GET    /api/v1/tasks/
POST   /api/v1/tasks/
GET    /api/v1/tasks/{id}/
PATCH  /api/v1/tasks/{id}/
POST   /api/v1/tasks/{id}/complete/
POST   /api/v1/tasks/{id}/cancel/
```

Tasks require title, matter, assignee, status; description and due date are optional according to serializer.

## Services/selectors

Deadlines:

- `deadline_list`
- `deadline_list_today`
- `deadline_list_upcoming`
- `deadline_list_overdue`
- `deadline_list_assigned_to_me`
- `deadline_create`
- `deadline_update`
- `deadline_complete`
- `deadline_cancel`

Tasks have equivalent explicit functions.

Completion/cancellation is idempotent and audited.
Assignment must target an active same-organization membership.
Counsel cannot reassign another user's work unless owner rules explicitly permit the operation; Admin/Manager can.

## Reminder scan

Celery Beat runs a bounded query for open deadlines entering configured reminder windows.
Creating delivery rows is idempotent through a unique deduplication key.
The scan does not send providers directly.

## Acceptance criteria

- [ ] All four required views match documented timezone semantics.
- [ ] Lists remain matter-permission-scoped.
- [ ] Cross-organization or inactive assignee is rejected.
- [ ] Completion/cancellation is idempotent and audited.
- [ ] Stale updates return `409`.
- [ ] Reminder scan creates no duplicate delivery intent for the same deadline/recipient/offset/channel.
- [ ] Query plans use appropriate indexes for status, due_at, assignee, and organization.
- [ ] Notice response deadlines can use the same Deadline model without special polymorphism.

## Required tests

- Frozen-time boundary tests before/at/after midnight in organization timezone.
- Today/upcoming/overdue/assigned-to-me.
- Permission and cross-organization assignment.
- Idempotent complete/cancel.
- Reminder deduplication.
- Filter and pagination.

## OpenAPI ownership

`apps/deadlines/api/v1/openapi.py` and `apps/tasks/api/v1/openapi.py`

## Related tasks

- BE-015, BE-017, BE-024, BE-029, BE-042
