# BE-042: Implement permission-scoped choice endpoints

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-002, BE-003, BE-004, BE-005, BE-006, BE-007, BE-013
Depends on: BE-018, BE-019, BE-022, BE-035

## Goal

Provide lightweight, searchable, cursor-paginated API endpoints for frontend form dropdowns.

The endpoints must:

1. Return only records the authenticated User may use.
2. Support search and cursor pagination.
3. Return lightweight choice representations.
4. Support infinite scrolling.
5. Never load every available record at once.
6. Never expose confidential or unnecessary fields.
7. Keep each domain responsible for its own OpenAPI declarations.

Do not create a generic lookup framework.

## Scope

Implement two choice endpoints:

```text
GET /api/v1/users/choices/
GET /api/v1/matters/choices/
```

These two endpoints are enough for the current forms.

Do not create separate choice endpoints for cases, contracts and notices unless a future form requires a domain-specific identifier rather than a Matter identifier.

## User choices

Endpoint:

```text
GET /api/v1/users/choices/
```

Supported query parameters:

```text
q
purpose
cursor
page_size
exclude_user_id
```

Supported purpose values:

```text
owner
assignee
participant
offboarding_replacement
```

Purpose rules must be defined explicitly in backend code.

Suggested behavior:

```text
owner:
- active User
- active Membership
- legal_admin, legal_manager or legal_counsel

assignee:
- active User
- active Membership
- legal_admin, legal_manager or legal_counsel

participant:
- active User
- active Membership
- all organization roles, including viewer

offboarding_replacement:
- active User
- active Membership
- legal_admin, legal_manager or legal_counsel
- exclude the departing User
```

The organization must always be derived from the authenticated User's active Membership.

The frontend must not submit `organization_id`.

### User-choice response

```json
{
  "next_cursor": "encoded-cursor-or-null",
  "has_more": true,
  "results": [
    {
      "id": "user-uuid",
      "label": "Sara Ahmadi",
      "secondary_label": "sara@example.test",
      "role": "legal_counsel"
    }
  ]
}
```

`id` must be the User ID expected by owner, assignee and participant foreign keys.

Do not return:

```text
password
is_staff
is_superuser
groups
user_permissions
authentication sessions
JWT information
organization details
invitation tokens
```

## Matter choices

Endpoint:

```text
GET /api/v1/matters/choices/
```

Supported query parameters:

```text
q
purpose
kind
cursor
page_size
exclude_matter_id
```

Supported purpose values:

```text
link
document_upload
deadline_create
task_create
notice_relation
```

Purpose rules must be explicit.

Examples:

```text
document_upload:
Return only Matters where the actor currently has document-upload permission.

deadline_create:
Return only Matters where the actor may create deadlines.

task_create:
Return only Matters where the actor may create tasks.

notice_relation:
Return only visible Matters that may be related to a Notice.

link:
Return visible Matters for ordinary relation fields.
```

Supported kind filters:

```text
case
contract
notice
```

The `kind` filter is optional.

### Matter-choice response

```json
{
  "next_cursor": "encoded-cursor-or-null",
  "has_more": true,
  "results": [
    {
      "id": "matter-uuid",
      "label": "اختلاف قراردادی با شرکت الف",
      "secondary_label": "LEG-1405-0021",
      "kind": "case"
    }
  ]
}
```

Do not return:

```text
complete descriptions
document contents
access-control records
confidential activity
internal storage keys
presigned URLs
```

## Search behavior

Use `q` as the controlled search parameter.

### User search fields

Search only:

```text
first_name
last_name
email
```

### Matter search fields

Search only:

```text
title
reference_code
```

Requirements:

1. Use case-insensitive controlled lookups.
2. Strip surrounding whitespace.
3. Limit query length.
4. Do not expose arbitrary lookup expressions.
5. Do not expose arbitrary ordering fields.
6. Empty `q` returns the first permitted page.
7. Search results remain permission-scoped.
8. Search must not reveal the existence of unauthorized records.

## Pagination

Use one small project-owned cursor pagination class:

```text
ChoiceCursorPagination
```

Suggested defaults:

```text
page_size = 20
max_page_size = 50
```

Use deterministic ordering.

Recommended:

```text
users: created_at, id
matters: created_at, id
```

Use descending ordering when consistent with existing project conventions.

The response must expose:

```text
next_cursor
has_more
results
```

Do not expose internal database offsets.

Do not create a custom pagination framework.

## ViewSet requirements

Continue using the existing project-owned ModelViewSets.

Add explicit custom actions:

```python
@action(
    detail=False,
    methods=["get"],
    url_path="choices",
)
def choices(self, request):
    ...
```

Apply this to the existing:

```text
User ViewSet
Matter ViewSet
```

Each ViewSet continues to inherit from exactly one approved common ViewSet base.

The action should:

1. Validate query parameters.
2. Call a permission-scoped selector.
3. Apply the choice pagination class.
4. Serialize the lightweight result.
5. Return the paginated response.

Do not put business permission rules directly inside the ViewSet.

## Serializer requirements

Add explicit serializers:

```text
UserChoiceSerializer
MatterChoiceSerializer
```

Each serializer inherits from exactly one approved common serializer base.

Declare all fields explicitly.

Do not use:

```text
fields = "__all__"
dynamic serializer generation
serializer factories
multiple serializer inheritance
generic choice serializer with model reflection
```

## Filter requirements

Add explicit filter serializers or FilterSets for:

```text
UserChoiceFilter
MatterChoiceFilter
```

Use `DjangoFilterBackend` where appropriate.

A small explicit serializer may validate `purpose`, `q`, `page_size` and exclusion identifiers before selector execution.

Do not allow the client to submit arbitrary role filters that could bypass purpose-specific rules.

## Selector requirements

Use plain functions.

Suggested signatures:

```python
def user_choices(
    *,
    actor,
    purpose,
    query="",
    exclude_user_id=None,
):
    ...
```

```python
def matter_choices(
    *,
    actor,
    purpose,
    query="",
    kind=None,
    exclude_matter_id=None,
):
    ...
```

Selectors must:

1. Derive the active organization from `actor`.
2. Apply active Membership rules.
3. Apply purpose-specific permission rules.
4. Use `select_related` where appropriate.
5. Avoid N+1 queries.
6. Return QuerySets.
7. Perform no writes.
8. Perform no logging of confidential results.
9. Return no cross-organization records.

Do not create selector classes.

## Purpose-rule implementation

Use small explicit functions or constant maps.

Example:

```python
ASSIGNABLE_ROLES = (
    MembershipRole.LEGAL_ADMIN,
    MembershipRole.LEGAL_MANAGER,
    MembershipRole.LEGAL_COUNSEL,
)
```

Do not create:

```text
ChoiceStrategy
PurposePolicy hierarchy
LookupProvider
LookupRepository
ChoiceEngine
Permission strategy classes
```

Simple `if` statements or small dictionaries are preferred.

## Rate limiting

Use Redis-backed throttle scopes:

```text
user_choices
matter_choices
```

Suggested initial rate:

```text
120/minute per authenticated User
```

The rate must remain configurable through settings.

Return `Retry-After` with `429`.

## Localization

Choice labels come from stored business values.

Canonical values such as:

```text
legal_counsel
case
contract
notice
```

remain untranslated.

Frontend translates role and Matter-kind labels.

Use `gettext_lazy` for validation and error messages.

## OpenAPI

Keep schema definitions in their owning domains:

```text
backend/apps/accounts/api/v1/openapi.py
backend/apps/matters/api/v1/openapi.py
```

Document:

* query parameters;
* supported purpose values;
* supported kind values;
* response fields;
* cursor behavior;
* authentication error;
* permission error;
* rate-limit response;
* `Retry-After`.

## Stable errors

```text
invalid_input              400
authentication_required   401
permission_denied         403
rate_limit_exceeded       429
```

Unauthorized records must simply not appear.

Do not return a list of records that were excluded by permission.

## Allowed scope

* Accounts User choice action
* Matter choice action
* Explicit choice serializers
* Explicit choice filters
* Choice selectors
* Cursor pagination
* Choice throttles
* Domain OpenAPI declarations
* Backend tests
* Related specifications and task references

Do not modify unrelated mutation services.

## Acceptance criteria

* [x] User choices are organization-scoped.
* [x] Matter choices are organization-scoped.
* [x] Unauthorized records never appear.
* [x] User choices use User IDs.
* [x] Matter choices use Matter IDs.
* [x] Owner purpose excludes inactive Users and inactive Memberships.
* [x] Assignee purpose excludes Viewer where required.
* [x] Participant purpose may include Viewer.
* [x] Offboarding replacement excludes the departing User.
* [x] Document-upload purpose applies upload permission.
* [x] Deadline purpose applies deadline-create permission.
* [x] Task purpose applies task-create permission.
* [x] Search is limited to documented fields.
* [x] Empty search returns a permitted first page.
* [x] Cursor pagination returns stable pages.
* [x] Maximum page size is enforced.
* [x] Response contains only lightweight fields.
* [x] No confidential fields are returned.
* [x] Rate limits use Redis.
* [x] `429` includes `Retry-After`.
* [x] OpenAPI validates.
* [x] Every class has one direct base.
* [x] Selectors are plain functions.
* [x] No generic lookup framework is introduced.
* [x] No multiple inheritance, polymorphism, repository, strategy hierarchy or service class is introduced.

## Required tests

Add tests for:

1. User-choice success.
2. User-choice organization isolation.
3. Inactive User exclusion.
4. Inactive Membership exclusion.
5. Owner-purpose role rules.
6. Assignee-purpose role rules.
7. Participant includes Viewer.
8. Offboarding replacement exclusion.
9. User name search.
10. User email search.
11. User cursor pagination.
12. User maximum page size.
13. Matter-choice success.
14. Matter organization isolation.
15. Matter title search.
16. Matter reference-code search.
17. Matter kind filter.
18. Document-upload permission filtering.
19. Deadline-create permission filtering.
20. Task-create permission filtering.
21. Matter cursor pagination.
22. Unauthorized Matter absent rather than exposed.
23. Safe response fields.
24. Rate limit and `Retry-After`.
25. English validation errors.
26. Persian validation errors.
27. OpenAPI contracts.
28. Query-count or N+1 protection.

Use at least two organizations.

## Verification commands

```bash
cd backend && python manage.py check
cd backend && python -m pytest apps/accounts/tests apps/matters/tests -q
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
python3 scripts/check_simplicity.py backend
python3 scripts/validate_docs.py
```

## Out of scope

* Generic lookup API.
* Arbitrary model selection.
* Arbitrary field search.
* Client-defined role permissions.
* Loading all choices.
* Elasticsearch.
* Qdrant.
* Recently used choices.
* User-created custom roles.
* New Party or Counterparty models.
* Mutation logic.
* Form implementation.

## Codex execution log

* Started: 2026-07-15 21:05 +0330
* Completed: 2026-07-15 21:37 +0330
* Files changed: `backend/common/api/errors.py`, `backend/common/api/exception_handler.py`, `backend/common/api/pagination.py`, `backend/common/api/throttles.py`, `backend/config/settings/base.py`, `backend/config/urls.py`, `backend/apps/accounts/api/v1/filters.py`, `backend/apps/accounts/api/v1/openapi.py`, `backend/apps/accounts/api/v1/serializers.py`, `backend/apps/accounts/api/v1/user_urls.py`, `backend/apps/accounts/api/v1/viewsets.py`, `backend/apps/accounts/selectors.py`, `backend/apps/accounts/tests/test_user_choices_api.py`, `backend/apps/matters/api/`, `backend/apps/matters/selectors.py`, `backend/apps/matters/tests/test_choice_api.py`, `docs/tech/15-api-endpoint-map.md`, linked backend specs, `tasks/INDEX.md`, `tasks/ORDER.md`, `tasks/backend/BE-042-return-choices.md`, `AI_USAGE.md`.
* Commands run: `cd backend && python manage.py check` (failed before Django startup: local pyenv version `3.12` is not installed); `cd backend && python -m pytest apps/accounts/tests apps/matters/tests -q` (failed before pytest startup for the same pyenv reason); `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` (failed before Django startup for the same pyenv reason); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be042-venv uv run --python /usr/bin/python3.12 --group dev python manage.py check` (passed); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be042-venv uv run --python /usr/bin/python3.12 --group dev python -m pytest apps/accounts/tests apps/matters/tests -q` (passed, 76 tests); `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be042-venv uv run --python /usr/bin/python3.12 --group dev python manage.py spectacular --file /tmp/openapi.yaml --validate` (passed with 0 errors and 2 existing status enum warnings); targeted Ruff format/check on touched Python files (passed after import-order fix); `python3 scripts/check_simplicity.py backend` (passed); `python3 scripts/validate_docs.py` (passed).
* Result: Passed. Implemented `/api/v1/users/choices/` and `/api/v1/matters/choices/` with explicit filter serializers, permission-scoped selectors, cursor pagination, safe lightweight serializers, Redis-backed throttle scopes, and owning-domain OpenAPI declarations.
* Deviations/questions: The repository had no existing User or Matter ViewSet for these choice actions, so small choice-only ViewSets were added under the owning domains and disabled list/retrieve operations. The literal task `python` commands remain blocked by the local pyenv shim before project code runs; uv-backed equivalents passed.
