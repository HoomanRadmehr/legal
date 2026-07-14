# BE-012: API consistency, OpenAPI, filtering, and localization

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-011, ARCH-004, ARCH-006, ARCH-009
- Depends on: BE-000 and all domain API specs

## Intent

Make the API predictable, documented per domain, safely filterable, and correctly localized without translating canonical data.

## API consistency

- `/api/v1/` namespace.
- Standard error envelope and request ID.
- Common pagination.
- Explicit filter/order allowlists.
- Stable machine error codes.
- `404` for non-visible confidential resources where specified.
- `409` for version/state/idempotency conflicts.
- `429` with `Retry-After`.

## OpenAPI

Each domain's `api/v1/openapi.py` owns operation descriptions, request/response serializers, examples, and custom headers.
Common errors are referenced from `common/api/openapi.py`.
Schema generation produces one YAML artifact and validates without unresolved errors.

## Localization

- Backend supports `en` and `fa`.
- Use `gettext_lazy as _` for enum labels, model labels, serializer errors, permission messages, and notification labels.
- `Accept-Language` selects response message language.
- Stored values remain canonical.
- Date/time responses remain ISO; optional display fields must be clearly named and are not authoritative.

## Filters

- All FilterSets are explicit.
- Date/time filters use ISO input.
- Unknown or disallowed ordering returns a safe validation response or is ignored according to one documented consistent policy.
- No `__all__` filter exposure.

## Acceptance criteria

- [ ] Every public endpoint appears in generated OpenAPI with stable operation ID.
- [ ] Every domain OpenAPI declaration is inside its domain directory.
- [ ] Common errors, idempotency header, and rate-limit response are documented.
- [ ] Schema validation passes in CI.
- [ ] Persian `Accept-Language` produces translated selected labels/errors.
- [ ] Canonical response enum values remain unchanged across languages.
- [ ] Date filters and timezone behavior are documented.
- [ ] Frontend schema type generation can consume the artifact.

## Required tests

- Schema generation/validation.
- Domain ownership convention check.
- Error localization.
- Enum canonical values.
- Explicit filter/order behavior.

## Related tasks

- BE-003, BE-004, BE-028, BE-029
