# FE-006: Deadline and task screens

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-005, ASSIGN-006
- Depends on: FE-002, BE-006

## Intent

Make today's, overdue, upcoming, and assigned work immediately visible and easy to complete without hiding permission or timezone behavior.

## Routes

```text
/deadlines
/tasks
```

Matter detail pages may embed filtered sections using the same explicit API functions.

## Deadline page

Tabs or segmented control:

- Today
- Overdue
- Upcoming
- Assigned to me

Additional filters: matter, assignee, priority, status, due range.
The active tab maps directly to backend `view` parameter.
Display organization timezone.

Actions:

- create/update when permitted;
- complete/cancel with confirmation where appropriate;
- reassign only for roles allowed by backend matrix.

## Task page

- Assigned-to-me default for Counsel/Viewer where relevant.
- Filters for matter, assignee, status, due date.
- Create/edit/complete/cancel according to role and access.

## Error and concurrency

- `409` version conflict prompts refetch.
- Idempotent repeated completion displays completed state, not an error loop.
- `429` shows retry guidance.

## Acceptance criteria

- [ ] Each required deadline view sends the correct backend parameter and renders empty/error/loading states.
- [ ] Organization timezone is visible and no client-only recalculation contradicts backend category.
- [ ] Matter links are shown only from returned records.
- [ ] Permission-aware assignment and action controls match FE-002.
- [ ] Complete/cancel updates list and matter detail queries.
- [ ] Notice response deadlines appear like normal deadlines.

## Required tests

- Four view parameters and tabs.
- Complete/cancel mutation and invalidation.
- Permission controls.
- 409/429 handling.
- Timezone label.

## Related tasks

- FE-009, FE-011
