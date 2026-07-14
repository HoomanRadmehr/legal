# BE-008: Activity log, audit trail, idempotency, and outbox

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-008, BR-028 through BR-030
- Depends on: BE-000, BE-002

## Intent

Create durable, append-only evidence for critical actions and reliable asynchronous handoff without a generic event framework.

## Activity model

Activity records contain organization, optional Matter, actor, action code, target type/id, redacted before/after values, safe metadata, request ID, and timestamp.

Initial action codes include:

```text
case.created
case.updated
matter.archived
matter.owner_changed
matter.access_granted
matter.access_revoked
contract.created
contract.updated
notice.created
notice.response_deadline_changed
deadline.created
deadline.completed
task.created
task.completed
document.upload_initiated
document.upload_completed
document.available
document.download_requested
offboarding.executed
```

Use explicit constants/choices; no dynamic event registry.

## Activity API

```text
GET /api/v1/activity/
GET /api/v1/matters/{matter_id}/timeline/
```

Lists are read-only, permission-scoped, filtered, paginated, and ordered newest first.
There is no create/update/delete endpoint for users.

## Audit function

Use a plain function such as `record_activity(...)` called explicitly from services.
It must not depend on Django signals.
Redaction is an explicit function with a safe allowlist of fields.

## Outbox

`create_outbox_event(...)` writes a row in the same transaction.
A Celery dispatcher processes unpublished rows idempotently with bounded retry and safe error codes.
Do not serialize whole model objects or sensitive document data in payloads.

## Idempotency

Critical endpoints use an `IdempotencyRecord` keyed by organization, actor, scope, and hashed key.
The request hash prevents the same key from being reused with different input.
Stored response data must be safe and bounded.

## Acceptance criteria

- [ ] Critical services explicitly write activity and outbox before transaction commit.
- [ ] Rollback removes both business and audit/outbox changes.
- [ ] Activity is read-only through API and permission-scoped.
- [ ] Sensitive values are redacted or omitted.
- [ ] Outbox dispatch is safe under duplicate worker execution.
- [ ] Idempotency returns the prior safe response for matching replay and `409` for conflicting input.
- [ ] No signal, event registry, or event-sourcing framework is introduced.

## Required tests

- Transaction rollback.
- Activity visibility/redaction.
- Append-only API.
- Outbox duplicate dispatch/retry.
- Idempotency matching/conflicting replay.

## OpenAPI ownership

`apps/activity/api/v1/openapi.py`; common idempotency header schema in `common/api/openapi.py`.

## Related tasks

- BE-018, BE-019, BE-026
