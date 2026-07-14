# BE-026: Implement activity list and matter timeline APIs

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-008
Depends on: BE-019, BE-011

## Goal

Expose read-only permission-scoped activity and matter timelines.

## Allowed scope

- `backend/apps/activity/api/v1/`
- `backend/apps/activity/selectors.py`
- `backend/apps/activity/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-008-activity-outbox.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement global activity selector scoped by role and visible matters.
2. Implement matter timeline selector.
3. Add read-only ViewSet/list endpoints, explicit filters, pagination, OpenAPI.
4. Map/redact before/after values according to action allowlist.
5. Prohibit create/update/delete actions.

## Acceptance criteria

- [ ] Viewer/Counsel cannot see activity for hidden matters.
- [ ] No mutation endpoint exists.
- [ ] Newest-first ordering and filters are stable.
- [ ] Sensitive fields remain redacted.

## Verification commands

```bash
cd backend && python -m pytest apps/activity/tests -q
```

## Out of scope

- Full forensic audit export.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
