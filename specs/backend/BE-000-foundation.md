# BE-000: Backend foundation and code structure

- Status: Approved
- Priority: P0
- Requirements: ARCH-001, ARCH-002, ARCH-004, ARCH-005, ARCH-006, ARCH-008, ARCH-010, ASSIGN-012
- Depends on: none

## Intent

Create a predictable Django foundation that all domain work can extend without introducing hidden behavior or complex inheritance.

## In scope

- Django project under `backend/` with settings modules for base, development, production, and test.
- DRF, PostgreSQL, django-filter, drf-spectacular, Celery, Channels, Redis, RabbitMQ, and MinIO configuration boundaries.
- Project base classes in `common`.
- Standard error envelope, pagination, request IDs, safe logging, and health endpoints.
- Domain app folder convention.
- pytest, linting, OpenAPI validation, and initial CI.
- Seed command framework and development Docker services.

## Out of scope

- Domain models beyond the custom User required by the initial migration dependency.
- Full production deployment automation.
- Generic framework code beyond the named small base classes.

## Required structure

```text
backend/common/
├── api/
│   ├── errors.py
│   ├── exception_handler.py
│   ├── filters.py
│   ├── openapi.py
│   ├── pagination.py
│   ├── serializers.py
│   ├── throttles.py
│   └── viewsets.py
├── auth/
├── realtime/
├── storage/
├── models.py
├── permissions.py
└── tests/
```

Domain apps use `apps/<domain>/api/v1/`.

## Base class contract

- `CommonModel` inherits only `models.Model` and provides UUID, `created_at`, `updated_at`.
- `CommonModelSerializer` inherits only `serializers.ModelSerializer` and declares common fields read-only.
- `CommonModelViewSet` inherits only `viewsets.ModelViewSet`, configures filter backends/pagination, and denies hard delete unless a domain explicitly overrides with an approved action.
- `CommonPermission` inherits only DRF `BasePermission` and exposes minimal shared helpers.
- `CommonFilterSet` inherits only `django_filters.FilterSet` and exposes no fields automatically.
- `CommonJsonConsumer` is added in BE-009 and follows the same one-base rule.

## Error contract

All handled API errors use:

```json
{
  "code": "stable_code",
  "message": "Localized message.",
  "details": {},
  "request_id": "uuid"
}
```

## Health contract

- `/health/live/` returns process liveness without expensive dependency checks.
- `/health/ready/` returns readiness with bounded checks for required serving dependencies.
- Health responses reveal no credentials or internal topology.

## Acceptance criteria

- [ ] Development settings start with `DEBUG=True`; production settings hardcode `DEBUG=False` and secure defaults.
- [ ] A real `.env` is ignored and `.env.example` documents required values.
- [ ] Each project base class has one direct base and contains only documented behavior.
- [ ] `CommonModelViewSet.destroy()` is unavailable by default.
- [ ] A validation error and a not-found error follow the standard envelope and include `X-Request-ID`.
- [ ] `DjangoFilterBackend` is in the common ViewSet configuration but no model automatically exposes all filters.
- [ ] OpenAPI generation and validation run in CI.
- [ ] Tests and lint commands run through documented local commands.
- [ ] `scripts/check_simplicity.py` passes on the backend.

## Required tests

- Settings selection and required-variable validation.
- Error envelope and request ID middleware.
- Hard delete disabled by default.
- Pagination maximum.
- Liveness/readiness safe responses.
- OpenAPI schema generation smoke test.

## Related tasks

- BE-001, BE-002, BE-003, BE-004, BE-005, BE-006
