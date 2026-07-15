# OpenAPI ownership and validation

## Ownership

Every backend domain keeps schema declarations beside its API code:

```text
apps/contracts/api/v1/openapi.py
apps/documents/api/v1/openapi.py
apps/offboarding/api/v1/openapi.py
```

This file owns:

- `extend_schema` helpers or decorators;
- operation summaries and descriptions;
- request/response serializer references;
- domain examples;
- custom action responses;
- documented headers such as `Idempotency-Key` and `Retry-After`.

Common error schemas live in `common/api/openapi.py`.

## Naming

Use stable operation IDs such as:

```text
cases_list
cases_create
contracts_partial_update
documents_presign
documents_complete
offboarding_preview
offboarding_execute
```

## Validation

CI must:

1. Generate an OpenAPI YAML file.
2. Run drf-spectacular validation.
3. Fail on schema warnings selected as project errors.
4. Regenerate frontend schema types when the contract changes.

## WebSocket contract

OpenAPI does not describe WebSocket messages well.
Maintain `docs/tech/asyncapi.yaml` or a simple versioned event contract document.
Do not introduce an AsyncAPI generator unless it remains small and useful.
