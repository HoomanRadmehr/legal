# Data, tenancy, and transaction guardrail

## Source of truth

PostgreSQL is the source of truth for users, memberships, matters, permissions, deadlines, tasks, documents, activity, notification state, upload sessions, idempotency, and outbox events.
Redis, RabbitMQ, WebSocket connections, and MinIO presigned URLs are derived or transient infrastructure.

## Organization scoping

- Every organization-owned table has a non-null `organization_id`, directly or through a non-ambiguous parent foreign key.
- Security-sensitive selectors include organization scope explicitly even when a join appears to imply it.
- Unique business identifiers include organization in the database constraint.
- Foreign references are validated to belong to the same organization.

## Matter composition

Use one concrete `Matter` table and explicit one-to-one detail tables:

```text
Matter 1---1 LegalCase
Matter 1---1 Contract
Matter 1---1 LegalNotice
```

This is composition, not model inheritance.
The service that creates a detail record also creates the matching Matter in one transaction.
No generic foreign key or model downcasting helper is allowed.

## Transactions

A service uses `transaction.atomic()` when it changes multiple records that must remain consistent.
Examples:

- create Matter + detail + owner access + activity + outbox;
- change notice response date + linked deadline + activity + outbox;
- complete deadline + activity + outbox;
- ownership transfer;
- offboarding execution.

Do not hold a transaction open while calling email, SMS, push, MinIO network methods that can be deferred, or RabbitMQ directly.
Write an outbox event and process it after commit.

## Concurrency

- Use an integer `version` on mutable matters and other critical records.
- The client sends the expected version for updates.
- An atomic conditional update or locked row detects stale writes and returns `409`.
- Use `select_for_update()` only where competing transactions could violate a real invariant.
- Idempotency records protect critical duplicate submissions.

## Deletion and retention

- Core legal records are archived, closed, cancelled, or revoked instead of hard-deleted.
- Activity logs and outbox delivery evidence are not editable through normal APIs.
- Temporary upload sessions may be marked expired and cleaned by a scheduled task.
- Physical object retention and legal holds are future production policies; the MVP must not pretend to implement them.
