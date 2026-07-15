# BE-002: Organizations, memberships, roles, and matter access

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-001, BR-001 through BR-004, BR-008, BR-021
- Depends on: BE-000, BE-001

## Intent

Create one explicit security model for organization tenancy, role boundaries, matter ownership, and record-level access.

## Data

### Organization

Name, timezone, default language, active status.

### Membership

Organization, user, role, status, join/offboarding dates. Unique organization + user.
Role values are exactly:

```text
legal_admin
legal_manager
legal_counsel
viewer
```

### MatterAccess

Matter, membership, level (`view` or `edit`), granted_by, revoked_at.
Only one active grant per matter and membership.

## Permission behavior

- Admin and Manager may view all organization matters.
- Counsel sees owned matters and active explicit grants.
- Viewer sees active explicit grants only.
- Edit requires Admin/Manager, ownership with eligible role, or explicit `edit` grant.
- Disabled membership denies all organization data regardless of ownership.
- Only Admin manages organization roles and runs offboarding.
- Owner/relation/assignee choices must be active same-organization memberships.

## Selectors and permission functions

Provide explicit functions such as:

```python
def get_active_membership(*, actor, organization): ...
def filter_visible_matters(*, queryset, membership): ...
def require_matter_view(*, membership, matter): ...
def require_matter_edit(*, membership, matter): ...
def require_manager(*, membership): ...
def require_admin(*, membership): ...
```

Do not create a rule engine, permission registry, or class hierarchy.
Each domain has one permission class that calls these functions.

## API scope

- Current membership is exposed through auth/me.
- Admin-only membership list/update endpoints may be minimal but must support seed/demo and offboarding.
- MatterAccess CRUD or grant/revoke actions are permission-scoped and audited.

## Acceptance criteria

- [ ] Organization A users cannot list or retrieve Organization B records by guessed UUID.
- [ ] Admin/Manager see organization matters; Counsel/Viewer see only defined scope.
- [ ] Viewer cannot create or mutate a matter, task, deadline, or upload.
- [ ] Inactive membership loses access even when the user is owner.
- [ ] Cross-organization owner, assignee, access, and relation inputs fail with a stable domain error.
- [ ] Grant/revoke writes an activity log and outbox event.
- [ ] Unauthorized confidential resource retrieval returns `404` where specified.
- [ ] Permission behavior is centralized in small functions, not hidden in model methods.

## Required tests

A role matrix test suite with two organizations and at least Admin, Manager, Counsel-owner, Counsel-grantee, Viewer-grantee, and unrelated users.

## OpenAPI ownership

`apps/organizations/api/v1/openapi.py` and `apps/matters/api/v1/openapi.py`

## Related tasks

- BE-008, BE-011, BE-012, BE-042
