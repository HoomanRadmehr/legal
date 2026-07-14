# FE-005: Legal notice screens

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-004
- Depends on: FE-002, BE-005, FE-006 deadline link behavior

## Intent

Support fast notice intake, related matter selection, response deadline visibility, and synchronized status feedback.

## Routes

```text
/notices
/notices/new
/notices/:noticeId
/notices/:noticeId/edit
```

## Form

- Matter title/reference/status/priority/owner/description.
- Sender.
- Received date.
- Response deadline.
- Response status.
- Explicit related matters selected from visible cases/contracts.
- Version for update.

The form explains that changing response deadline updates the linked deadline.
Cross-organization or invisible related records never appear in choices.

## Detail

- Notice summary and related matter links.
- Prominent response deadline state.
- Linked deadline status and assignee.
- Timeline, tasks, and documents.

## Acceptance criteria

- [ ] Notice intake validates received/response ordering and displays backend domain errors.
- [ ] Related matter search uses only permission-scoped API results.
- [ ] Successful create/update refreshes both notice and linked deadline views.
- [ ] Overdue/today status uses data returned by the backend and localized display.
- [ ] Version/archive/permission behavior matches other matters.

## Required tests

- Form date rule.
- Related matter selection and denial.
- Linked deadline query invalidation.
- Version conflict.
- Viewer read-only behavior.

## Related tasks

- FE-010
