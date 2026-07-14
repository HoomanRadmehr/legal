# Code review checklist

## Scope

- [ ] Change maps to one task and linked specs.
- [ ] No unrelated refactor.
- [ ] Acceptance criteria were not rewritten after implementation.

## Simplicity

- [ ] No multiple inheritance.
- [ ] No polymorphic domain code or generic foreign key.
- [ ] No business signals or hidden model side effects.
- [ ] Services/selectors are plain functions.
- [ ] Functions and components remain within documented size/complexity limits.
- [ ] New abstraction has at least three clear uses and improves readability.

## Security

- [ ] Organization and record visibility are applied before retrieval.
- [ ] Mutation service re-checks authorization.
- [ ] Tokens, cookies, presigned URLs, credentials, and sensitive content are not logged.
- [ ] Rate limit and error behavior are correct where relevant.
- [ ] Upload and WebSocket flows do not trust client identity or state.
- [ ] Audit and outbox are written with critical mutations.

## Data and reliability

- [ ] Database constraints support important invariants.
- [ ] Transaction boundary is explicit.
- [ ] External call is not inside a long database transaction.
- [ ] Idempotency/concurrency is handled where specified.

## Contract and UX

- [ ] OpenAPI annotations are in the domain directory.
- [ ] Stable error codes are documented.
- [ ] Localization and date behavior are correct.
- [ ] Frontend handles loading, empty, error, and forbidden states.

## Verification

- [ ] Relevant tests pass.
- [ ] OpenAPI validates.
- [ ] Lint/type/build checks pass.
- [ ] Documentation/task log updated.
