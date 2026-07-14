# BE-016: Implement legal notice API with linked response deadline

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-005
Depends on: BE-012, BE-015, BE-019, BE-018

## Goal

Deliver notice intake and update with one synchronized response Deadline and explicit related matters.

## Allowed scope

- `backend/apps/notices/`
- `backend/apps/deadlines/`
- `backend/apps/notices/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-005-notices.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create LegalNotice one-to-one model and relation handling.
2. Implement create service that writes Matter, Notice, linked Deadline, relations, activity, outbox atomically.
3. Implement update service that synchronizes response deadline.
4. Add selectors, serializers, ViewSet, filters, OpenAPI.
5. Test invalid dates, relations, rollback, permissions, version.

## Acceptance criteria

- [ ] Notice and linked Deadline cannot diverge through API services.
- [ ] Invalid response date returns 422.
- [ ] Invisible/cross-org related matter is rejected safely.
- [ ] Notice appears in deadline views.
- [ ] No generic foreign key is used.

## Verification commands

```bash
cd backend && python -m pytest apps/notices/tests apps/deadlines/tests -q
```

## Out of scope

- Complex workflow approvals.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
