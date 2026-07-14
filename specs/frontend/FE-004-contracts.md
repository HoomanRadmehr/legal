# FE-004: Contract screens

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-003
- Depends on: FE-002, BE-004

## Intent

Provide explicit contract list, detail, create, and update screens with clear renewal and expiration date handling.

## Routes

```text
/contracts
/contracts/new
/contracts/:contractId
/contracts/:contractId/edit
```

## List and filters

Status, priority, owner, contract type, counterparty, effective/expiration/renewal ranges, archived state, title/reference search.
Highlight expiring or renewing contracts without using color alone.

## Form

- Title, reference, type, status, priority, owner, counterparty.
- Effective, expiration, and renewal dates.
- Description and bounded key terms input.
- Jalali input when Persian locale is selected; ISO value sent to API.
- Client date checks mirror the simple backend rules but backend error remains authoritative.
- Version included for updates.

## Detail

Summary, dates, key terms, owner, status, linked deadlines/tasks/documents, timeline, archive/edit controls.

## Acceptance criteria

- [ ] Date fields round-trip correctly between Jalali UI and ISO API.
- [ ] Invalid date order is shown next to fields using backend `contract_date_invalid` details.
- [ ] Filters match backend contract.
- [ ] Version conflict is handled without silent overwrite.
- [ ] Permission and archive behavior match FE-002.
- [ ] Expiring/renewing indicators are accessible.

## Required tests

- Date validation and conversion.
- List filters.
- Create/update/error mapping.
- Permission and version conflict.
- Accessible date warning.

## Related tasks

- FE-008
