# BE-013: Implement legal case API and services

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-003
Depends on: BE-012, BE-019, BE-018

## Goal

Deliver permission-scoped case create/list/retrieve/update/archive with parties, activity, and outbox.

## Allowed scope

- `backend/apps/cases/`
- `backend/apps/matters/`
- `backend/apps/cases/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-003-cases.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create LegalCase one-to-one and CaseParty models.
2. Implement case selectors with select/prefetch optimization and visibility scope.
3. Implement create/update/archive services with transactions and expected version.
4. Use explicit ModelSerializers and CommonModelViewSet actions.
5. Add filters/order/search allowlists.
6. Add domain OpenAPI and tests.

## Acceptance criteria

- [ ] Create writes Matter/detail/parties/activity/outbox atomically.
- [ ] Case API ID equals Matter UUID.
- [ ] Stale update returns 409.
- [ ] Archive does not hard-delete.
- [ ] Viewer and cross-org users cannot mutate or infer hidden records.

## Verification commands

```bash
cd backend && python -m pytest apps/cases/tests -q
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
```

## Out of scope

- Linked tasks/deadlines/documents UI or generic nested writer.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
