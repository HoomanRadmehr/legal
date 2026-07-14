# BE-010: Permission-aware dashboard

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-009
- Depends on: BE-003 through BE-006

## Intent

Provide one fast summary of the legal workload without leaking counts or items the user cannot view.

## API

```text
GET /api/v1/dashboard/
```

## Response sections

- Case counts by relevant status and priority.
- Contract counts including expiring/renewing within a documented horizon.
- Notice counts including open response obligations.
- Deadlines: today, overdue, upcoming, assigned-to-me.
- User tasks due/overdue.
- Recent permitted activity.

Example shape:

```json
{
  "cases": {"total": 12, "open": 8, "high_priority": 3},
  "contracts": {"total": 9, "expiring_soon": 2},
  "notices": {"open": 4, "response_overdue": 1},
  "deadlines": {"today": 2, "overdue": 1, "upcoming": 7, "assigned_to_me": 3},
  "tasks": {"assigned_to_me": 5, "overdue": 1},
  "recent_activity": []
}
```

## Selector behavior

Use explicit aggregate selectors built from the same permission-scoped Matter base as list endpoints.
Do not calculate counts from unrestricted organization tables and filter later.
Caching is optional; if added, the cache key includes organization, membership/role/access version, locale when content is localized, and a short TTL.

## Acceptance criteria

- [ ] Counts match what the same user can list through domain endpoints.
- [ ] Viewer/Counsel counts do not reveal hidden matters.
- [ ] Deadline sections use organization timezone.
- [ ] Recent activity is permission-scoped and redacted.
- [ ] Query count and response time are reasonable for seeded MVP data.
- [ ] Cache, if used, cannot cross users/organizations and tolerates stale data only within documented TTL.

## Required tests

- Role and explicit-access count parity.
- Cross-organization isolation.
- Timezone deadline summary.
- Query count regression target.

## OpenAPI ownership

`apps/dashboard/api/v1/openapi.py`

## Related tasks

- BE-025, BE-029
