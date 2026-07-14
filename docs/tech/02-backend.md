# Backend technical design

## Framework conventions

- Django and Django REST Framework.
- ASGI deployment to support HTTP and Channels.
- UUID primary keys for public business records.
- `gettext_lazy` for backend labels and messages.
- `django-filter` for explicit filters.
- `drf-spectacular` for OpenAPI.
- pytest for tests.

## Project layout

```text
backend/
├── config/
│   ├── settings/
│   ├── asgi.py
│   ├── celery.py
│   ├── routing.py
│   └── urls.py
├── common/
│   ├── api/
│   ├── auth/
│   ├── models.py
│   ├── permissions.py
│   ├── realtime/
│   ├── storage/
│   └── tests/
└── apps/
    └── <domain>/
```

## Common base classes

### `CommonModel`

Contains only:

- UUID primary key;
- `created_at`;
- `updated_at`.

Do not include organization, owner, archive, version, or audit behavior because not every model needs them.

### `CommonModelSerializer`

Contains common read-only field declarations and no dynamic field behavior.

### `CommonModelViewSet`

Contains:

- standard pagination;
- `DjangoFilterBackend` and explicit ordering support;
- common exception/response integration;
- hard-delete disabled by default.

It does not implement domain authorization or mutation behavior.

### `CommonPermission`

Contains small safe helpers such as obtaining active membership from request context.
It does not contain a universal role engine.

### `CommonFilterSet`

Contains only shared date-range helpers if they remain straightforward.
No automatic model field exposure.

## Selectors

Naming examples:

```python
def case_list(*, actor, organization): ...
def case_get(*, actor, organization, case_id): ...
def deadline_list_today(*, actor, organization, now): ...
```

Selectors:

- do not mutate;
- begin with organization and visibility constraints;
- use `select_related` and `prefetch_related` deliberately;
- return QuerySets when the caller needs filtering/pagination;
- raise domain-safe not-found behavior through a small common helper only if clearer than standard `get_object_or_404`.

## Services

Naming examples:

```python
def case_create(*, actor, organization, data): ...
def case_update(*, actor, case, data, expected_version): ...
def matter_transfer_owner(*, actor, matter, new_owner, expected_version, idempotency_key): ...
```

Services:

- are module-level functions;
- validate business authorization and invariants;
- own database transaction boundaries;
- return created or updated models;
- explicitly call audit and outbox functions;
- do not accept `request` objects;
- do not return DRF `Response` objects;
- do not call external providers inside transactions.

## Serializers and ViewSets

Use explicit ModelSerializers for list, detail, create, and update when their fields differ.
Avoid writable nested serializers; use an explicit service for child rows such as case parties.

A write action follows:

```python
input_serializer = CaseUpdateSerializer(data=request.data, partial=True)
input_serializer.is_valid(raise_exception=True)
case = case_update(
    actor=request.user,
    case=self.get_object(),
    data=input_serializer.validated_data,
    expected_version=input_serializer.validated_data["version"],
)
return Response(CaseDetailSerializer(case, context=self.get_serializer_context()).data)
```

The exact code may be factored into one small common response helper, but do not create a generic command framework.
