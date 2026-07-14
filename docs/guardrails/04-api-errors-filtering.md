# API, errors, filtering, and compatibility guardrail

## API conventions

- Base path: `/api/v1/`.
- Resource names are plural nouns.
- Use `ModelViewSet` via the project `CommonModelViewSet`.
- Standard actions are list, retrieve, create, partial update, and explicit archive where permitted.
- Hard `destroy` is disabled by default.
- Custom actions use clear verbs only when not representable as resource state changes, such as `preview-offboarding` or `complete-upload`.

## Standard error envelope

```json
{
  "code": "stable_machine_code",
  "message": "Localized human-readable message.",
  "details": {},
  "request_id": "uuid"
}
```

- `code` is stable and untranslated.
- `message` may be localized with `Accept-Language`.
- `details` is structured and does not expose stack traces or storage internals.

## Status codes

- `400`: malformed or transport validation error.
- `401`: authentication required or invalid token.
- `403`: authenticated but forbidden when existence disclosure is not a concern.
- `404`: absent or not visible confidential resource.
- `409`: version, state, or idempotency conflict.
- `413`: upload policy size exceeded.
- `422`: valid request shape but domain rule failure.
- `429`: rate limit exceeded, with `Retry-After`.
- `503`: temporary dependency unavailable.

## Filtering

- Use `DjangoFilterBackend`.
- Every domain defines an explicit `FilterSet`.
- Do not use `fields = '__all__'`.
- Explicitly list ordering fields and ensure common sort columns are indexed.
- Search fields are allowlisted and do not include secret or unbounded JSON data.
- Date ranges use unambiguous ISO query parameters.

## Pagination

Use one standard page-number or cursor pagination class across normal lists.
Set a safe default and maximum page size.
Large export is a separate asynchronous feature, not an unbounded list endpoint.

## OpenAPI

- Domain schema annotations live in `apps/<domain>/api/v1/openapi.py`.
- Common error components live in `common/api/openapi.py`.
- Operation IDs are stable and domain-prefixed.
- Examples must not contain real personal or legal data.
- CI generates and validates the schema.
- Frontend generated types are refreshed when the contract changes.
