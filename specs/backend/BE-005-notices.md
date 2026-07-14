# BE-005: Legal notice management

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-004, BR-005 through BR-010, BR-014 through BR-016
- Depends on: BE-002, BE-006 data contract

## Intent

Register incoming legal notices and ensure every active response deadline is visible in the common deadline system.

## Data

A notice consists of:

- one `Matter(kind="notice")`;
- one `LegalNotice` one-to-one detail;
- one linked response `Deadline` for active notices;
- optional explicit `MatterRelation` rows to cases or contracts.

Notice fields:

- sender;
- received date;
- response deadline;
- response status;
- related matters.

## API

```text
GET    /api/v1/notices/
POST   /api/v1/notices/
GET    /api/v1/notices/{id}/
PATCH  /api/v1/notices/{id}/
POST   /api/v1/notices/{id}/archive/
GET    /api/v1/notices/{id}/timeline/
```

## Domain behavior

- Response deadline must not precede received date according to the selected date/time representation.
- Creating an active notice creates the linked Deadline in the same transaction.
- Updating response deadline updates the linked Deadline in the same transaction.
- Cancelling/closing the response obligation updates both records through one named service.
- Related matters must be visible and in the same organization.
- No GenericForeignKey is used.

## Filters

Sender, response status, owner, matter status, received range, response deadline range, overdue flag through deadline query, archived state, title/reference search.

## Acceptance criteria

- [ ] Notice create and linked response Deadline are atomic.
- [ ] Response date change updates both Notice and Deadline atomically.
- [ ] Invalid received/response ordering returns `notice_response_date_invalid` with `422`.
- [ ] Cross-organization or invisible related matter is rejected without leaking details.
- [ ] Notice appears in common deadline views.
- [ ] Update uses expected version and stale data returns `409`.
- [ ] Activity and outbox include notice and deadline-relevant actions.

## Required tests

- Create/update rollback.
- Linked deadline synchronization.
- Related matter permission.
- Deadline view inclusion.
- Role and organization isolation.
- Version/archive/timeline.

## OpenAPI ownership

`apps/notices/api/v1/openapi.py`

## Related tasks

- BE-015, BE-016, BE-019
