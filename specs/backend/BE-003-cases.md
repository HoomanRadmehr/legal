# BE-003: Legal case management

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-002, BR-005 through BR-011
- Depends on: BE-002

## Intent

Allow authorized users to create, view, filter, update, archive, and audit legal cases without polymorphic models or hidden write behavior.

## Data

A case consists of:

- one `Matter(kind="case")`;
- one `LegalCase` one-to-one detail;
- zero or more explicit `CaseParty` rows.

Required Matter fields: title, reference code, status, priority, owner, description, version.
Case detail: case type, court/authority optional, filing/open/close dates as selected by implementation.
Party: name and role required; safe optional contact summary.

## API

```text
GET    /api/v1/cases/
POST   /api/v1/cases/
GET    /api/v1/cases/{id}/
PATCH  /api/v1/cases/{id}/
POST   /api/v1/cases/{id}/archive/
GET    /api/v1/cases/{id}/timeline/
```

Use ModelViewSet through `CommonModelViewSet`.
Create/update serializers are ModelSerializers with explicit fields.
Party writes occur through the case service in an explicit payload; no generic nested-save framework.

## Filters and ordering

Allowlist at minimum:

- status;
- priority;
- owner;
- case type;
- created/opened date ranges;
- archived state;
- search on title and reference code.

Allow ordering only on indexed/reviewed fields such as created_at, updated_at, priority, reference_code.

## Services/selectors

- `case_list`
- `case_get`
- `case_create`
- `case_update`
- `case_archive`
- `case_timeline`

Creation is one transaction for Matter, LegalCase, parties, owner access if needed, activity, and outbox.
Update requires expected version and returns `409` on stale data.

## Authorization

Follow BE-002.
Counsel may create a case and becomes owner unless an allowed owner is supplied under role rules.
Only Admin/Manager may assign a different owner during creation or transfer ownership.

## Timeline

Return permission-filtered activity events for the case's Matter in reverse chronological order.
Do not include secret before/after values that the viewer is not allowed to see.

## Acceptance criteria

- [ ] Authorized create writes Matter, LegalCase, parties, activity, and outbox atomically.
- [ ] Case ID is the Matter UUID consistently at the API boundary.
- [ ] Reference code is unique per organization and can repeat in another organization.
- [ ] List/retrieve respect all role and explicit-access rules.
- [ ] Filters and ordering expose only allowlisted fields.
- [ ] Stale update returns `case_version_conflict` with `409`.
- [ ] Archive preserves the record and activity history.
- [ ] Timeline is permission-aware and ordered.
- [ ] No polymorphic model, generic relation, signal, or nested-write framework is used.

## Required tests

- Create and rollback on invalid party.
- Organization-scoped reference uniqueness.
- Role/access list and retrieve.
- Filter/order allowlists.
- Version conflict.
- Archive and timeline audit.

## OpenAPI ownership

`apps/cases/api/v1/openapi.py`

## Related tasks

- BE-013, BE-018, BE-019, BE-026, BE-029
