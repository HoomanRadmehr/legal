# BE-025: Implement permission-aware dashboard selectors and API

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-010
Depends on: BE-013, BE-014, BE-016, BE-015, BE-017

## Goal

Return dashboard summaries derived from the same visible records as list APIs.

## Allowed scope

- `backend/apps/dashboard/`
- `backend/apps/dashboard/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-010-dashboard.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement explicit aggregate selectors per section.
2. Build one read-only dashboard endpoint and serializer.
3. Use organization timezone for deadline/task sections.
4. Include recent permission-scoped activity after BE-026 integration.
5. Add query-count and role parity tests.
6. Add domain OpenAPI.

## Acceptance criteria

- [ ] Counts equal what the user can list.
- [ ] No hidden organization count leaks to Counsel/Viewer.
- [ ] Response query count is bounded for seed data.
- [ ] No unrestricted aggregate then Python filtering.

## Verification commands

```bash
cd backend && python -m pytest apps/dashboard/tests -q
```

## Out of scope

- Advanced analytics/charts.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
