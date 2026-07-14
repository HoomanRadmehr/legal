# BE-014: Implement contract API and date rules

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-004
Depends on: BE-012, BE-019, BE-018

## Goal

Deliver contract CRUD-with-archive using explicit date validation, filters, activity, and outbox.

## Allowed scope

- `backend/apps/contracts/`
- `backend/apps/contracts/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-004-contracts.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Contract one-to-one model and bounded key terms policy.
2. Implement selectors and create/update/archive services.
3. Validate effective/expiration/renewal ordering in named functions.
4. Add explicit ModelSerializers, ViewSet, FilterSet, permissions, URLs, OpenAPI.
5. Add role, date, version, and transaction tests.

## Acceptance criteria

- [ ] Invalid date order returns 422 stable error.
- [ ] Version conflict returns 409.
- [ ] List filters are allowlisted and permission-scoped.
- [ ] Archive preserves audit history.
- [ ] No polymorphic serializer or model is used.

## Verification commands

```bash
cd backend && python -m pytest apps/contracts/tests -q
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
```

## Out of scope

- Automatic renewal workflow.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
