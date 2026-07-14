# Background jobs and outbox

## Celery responsibilities

- Dispatch outbox events.
- Deliver notification channels.
- Verify/process completed uploads.
- Scan deadline reminder windows.
- Expire abandoned upload sessions.
- Retry transient provider failures.

## Task rules

- Tasks receive IDs, not serialized model objects.
- Tasks are idempotent.
- Retries are bounded and use backoff for transient errors.
- Permanent failures record a safe error code.
- Network calls occur outside database transactions.
- Task functions remain small and call service functions.
- Large result payloads are not returned through Celery.

## Transactional outbox

A mutation service writes the domain changes, activity log, and outbox row in one transaction.
A dispatcher selects unpublished events using safe locking, publishes or handles them, and marks success.

For the modular monolith, the first implementation may process some events directly through Celery tasks rather than publishing a second RabbitMQ business-event topology, as long as the outbox row is the durable handoff and retry evidence.
Do not overbuild a generic event bus.

## Celery Beat

Run one Beat instance.
Initial schedules:

- deadline reminder scan;
- expired upload cleanup;
- stale outbox retry;
- token blacklist cleanup if the JWT package requires it.

Schedules are configurable but have safe defaults.
