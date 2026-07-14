# Backend AGENTS.md

This file supplements the root `AGENTS.md` for all backend changes.

## Required architecture

- Django and Django REST Framework in a modular monolith.
- PostgreSQL is authoritative.
- Domain apps live under `backend/apps/<domain>/`.
- Cross-cutting base classes and small helpers live under `backend/common/`.
- Each domain owns its serializers, filters, permission class, ViewSet, URL registration, and OpenAPI declarations.

Expected domain shape:

```text
apps/cases/
├── api/v1/
│   ├── filters.py
│   ├── openapi.py
│   ├── permissions.py
│   ├── serializers.py
│   ├── urls.py
│   └── viewsets.py
├── models.py
├── selectors.py
├── services.py
├── tasks.py
└── tests/
```

## Base classes

Provide small project classes in `common`:

- `CommonModel(models.Model)` with UUID, `created_at`, and `updated_at` only.
- `CommonModelSerializer(serializers.ModelSerializer)` with common read-only fields only.
- `CommonModelViewSet(viewsets.ModelViewSet)` with standard filters, pagination, and hard-delete disabled by default.
- `CommonPermission(permissions.BasePermission)` with small shared helpers only.
- `CommonFilterSet(django_filters.FilterSet)` with no automatic field exposure.
- `CommonJsonConsumer(AsyncJsonWebsocketConsumer)` with ticket-authenticated connection helpers.

Every domain class inherits exactly one of these where applicable. Do not use mixins.
The custom `User` inherits only `AbstractUser` and explicitly declares its UUID field.

## Services and selectors

- Use plain functions, not classes.
- Service functions are keyword-only and execute one clear business operation.
- Selector functions begin from an organization- and permission-scoped queryset.
- Do not put domain writes in serializer `create()` or `update()` methods.
- ViewSet write actions explicitly validate a `ModelSerializer`, call a service, then serialize the result.
- Use `transaction.atomic()` in services that change multiple records.
- Use `select_for_update()` only where a race is meaningful and explain it in a comment.

## Models and relationships

- No polymorphic models.
- No generic foreign keys.
- Use a concrete `Matter` table as the shared permission and linkage boundary.
- `LegalCase`, `Contract`, and `LegalNotice` use explicit one-to-one composition with `Matter`; they do not inherit from it.
- Documents, deadlines, tasks, activity logs, and access grants point to `Matter`.
- Add database constraints for invariants, organization-scoped uniqueness, and valid date ranges where practical.

## API

- Prefix all endpoints with `/api/v1/`.
- Use `ModelViewSet` through `CommonModelViewSet`.
- Use `ModelSerializer` through `CommonModelSerializer`.
- Use `DjangoFilterBackend` and explicit filter and ordering allowlists.
- Put each domain's `extend_schema` declarations, examples, and response maps in `apps/<domain>/api/v1/openapi.py`.
- Common error schemas may live in `common/api/openapi.py`.
- Validate generated OpenAPI in CI.

## Security

- JWT access token in the Authorization header.
- Rotated refresh token in a Secure, HttpOnly cookie in production.
- CSRF protection on cookie-authenticated refresh and logout endpoints.
- Use permission-scoped selectors before `.get()`.
- Never accept organization ownership from request data without deriving or validating it.
- Use Redis-backed throttles for login, refresh, upload initiation/completion, exports, and expensive list endpoints.
- Use one-time Redis WebSocket tickets; do not use a long-lived JWT in the WebSocket query string.
- Never expose MinIO credentials or permanent object URLs.

## Localization

Use `django.utils.translation.gettext_lazy as _` for model labels, enum labels, serializer errors, permission errors, and notification template labels.
Persist canonical English enum values, not translated strings.

## Tests

Use pytest and pytest-django.
Use factories with clear defaults.
Security and permission tests must use at least two organizations and multiple roles.
Do not use snapshots for core permission or business-rule assertions.
