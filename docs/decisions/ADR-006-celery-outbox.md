# ADR-006: Celery with a transactional outbox

- Status: Accepted
- Context: Notifications and upload processing must be asynchronous without losing work after a database commit.
- Decision: Use RabbitMQ/Celery and persist `OutboxEvent` in the same transaction as the business change. Workers process durable events idempotently.
- Consequences: More tables and retry handling, but reliable handoff. Keep the implementation narrow; do not create a generic event platform.
- Rejected: Direct provider calls inside transactions, Temporal, event sourcing.
