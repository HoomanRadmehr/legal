# Definition of done

A feature or task is done only when all applicable items are true.

## Behavior

- Acceptance criteria pass.
- Error and edge cases are handled with stable codes.
- No hidden or undocumented behavior was added.

## Security

- Organization and record permissions are enforced in selectors and services.
- Sensitive values are not logged or returned.
- Rate limit, idempotency, CSRF, upload, and WebSocket requirements are implemented where applicable.

## Simplicity

- No multiple inheritance.
- No polymorphic domain code or generic relation.
- No business signals, service classes, metaclasses, or generic CRUD engine.
- Functions/components remain within guardrail limits.
- Code uses standard framework patterns and explicit names.

## Quality

- Tests pass.
- Lint/type checks pass.
- OpenAPI validates and frontend types are current when the API changed.
- Migration is present and reviewed when data model changed.
- Localization and accessibility are covered where applicable.

## Delivery evidence

- Task status and execution log updated.
- `AI_USAGE.md` updated with meaningful prompt/correction evidence.
- Setup or operational docs updated when behavior changed.
- No secret or generated runtime data committed.
