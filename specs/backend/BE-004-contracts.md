# BE-004: Contract management

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-003, BR-005 through BR-010, BR-012, BR-013
- Depends on: BE-002

## Intent

Manage contracts and renewal dates with explicit validation, permission-scoped queries, and auditable versioned updates.

## Data

A contract consists of one `Matter(kind="contract")` and one explicit `Contract` one-to-one detail.

Contract fields:

- contract type;
- counterparty;
- effective date;
- expiration date optional;
- renewal date optional;
- key terms as a bounded JSON object or explicit simple text fields chosen in implementation.

Key terms must have a documented maximum serialized size and may not contain uploaded file content.

## API

```text
GET    /api/v1/contracts/
POST   /api/v1/contracts/
GET    /api/v1/contracts/{id}/
PATCH  /api/v1/contracts/{id}/
POST   /api/v1/contracts/{id}/archive/
GET    /api/v1/contracts/{id}/timeline/
```

## Domain validation

- Effective date is required.
- Expiration cannot precede effective date.
- Renewal cannot precede effective date.
- The implementation must document whether renewal after expiration is rejected or explicitly allowed; default is reject for MVP.
- Owner and organization rules follow BE-002.

## Filters

Status, priority, owner, contract type, counterparty, effective/expiration/renewal date ranges, archived state, title/reference search.

## Services/selectors

- `contract_list`
- `contract_get`
- `contract_create`
- `contract_update`
- `contract_archive`
- `contract_timeline`

Create/update write activity and outbox in the same transaction.
Expected version is mandatory for updates.

## Acceptance criteria

- [ ] Create atomically writes Matter, Contract, activity, and outbox.
- [ ] Invalid date ordering returns `contract_date_invalid` with `422` and field details.
- [ ] List/retrieve/update follow BE-002 permissions.
- [ ] Counterparty and renewal/expiration filters work and are documented.
- [ ] Version conflict returns `409` without overwriting data.
- [ ] Archive is audited and does not hard-delete.
- [ ] Contract schemas and examples are owned in the contract domain.

## Required tests

- Date matrix.
- Cross-organization access.
- Role update boundaries.
- Filter ranges.
- Version conflict and archive.
- Audit/outbox atomicity.

## OpenAPI ownership

`apps/contracts/api/v1/openapi.py`

## Related tasks

- BE-014, BE-018, BE-019, BE-029, BE-042
