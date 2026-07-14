# FE-003: Case screens

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-002
- Depends on: FE-002, BE-003

## Intent

Let permitted users list, inspect, create, update, archive, and review the timeline of legal cases.

## Routes

```text
/cases
/cases/new
/cases/:caseId
/cases/:caseId/edit
```

## List

- Paginated table or responsive list.
- Search by title/reference.
- Explicit filters for status, priority, owner, case type, date range, archived state.
- Explicit ordering choices.
- Loading, empty, error, and rate-limited states.
- Create action shown only when allowed.

## Create/edit form

Fields mirror BE-003 and use explicit Zod schemas.
Party rows are a simple explicit field array.
Owner choices are loaded from allowed active memberships.
Edit includes hidden/read-only current version and sends it with update.
A `409 case_version_conflict` shows a clear reload/review message and does not silently overwrite.

## Detail

- Summary, owner, status, priority, dates, description, parties.
- Linked deadlines, tasks, and documents through feature sections.
- Timeline tab.
- Archive/edit actions according to permission.

## Acceptance criteria

- [ ] List query parameters match documented backend filters.
- [ ] Form prevents obvious invalid input but relies on backend for final domain validation.
- [ ] Create/update errors map to fields or a safe page message.
- [ ] Version conflict asks the user to reload and preserves unsaved input where practical.
- [ ] Viewer sees read-only detail and no mutation controls.
- [ ] Archive requires confirmation and removes record from active default list without pretending deletion.
- [ ] Timeline displays safe localized action labels.

## Required tests

- List/filter/query mapping.
- Create/edit validation.
- Permission-aware actions.
- Version conflict.
- Archive confirmation.
- Timeline loading/error.

## Related tasks

- FE-007
