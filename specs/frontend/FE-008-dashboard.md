# FE-008: Dashboard

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-009
- Depends on: FE-002, BE-010

## Intent

Show a concise permission-aware summary that directs each role to urgent work.

## Sections

- Case summary.
- Contract expiration/renewal summary.
- Open notice and response obligation summary.
- Deadline today/overdue/upcoming/assigned-to-me.
- Assigned tasks and overdue tasks.
- Recent activity.

Each card links to the corresponding pre-filtered page.
Do not compute hidden totals from client-side cached collections.

## States

- Skeleton/loading.
- Full/partial empty state.
- Error with retry.
- Rate-limited state.
- No access/empty role state.

## Acceptance criteria

- [ ] Values are rendered directly from permission-aware dashboard response.
- [ ] Links preserve the intended filters.
- [ ] Urgency is conveyed with text/icon, not color alone.
- [ ] Viewer/Counsel UI does not imply organization-wide totals.
- [ ] Recent activity links only to returned visible records.
- [ ] Layout works in English LTR and Persian RTL.

## Required tests

- Response rendering.
- Filter links.
- Empty/error/429.
- Accessible urgency.
- Role-specific labels.

## Related tasks

- FE-014
