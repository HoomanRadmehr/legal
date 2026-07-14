# BE-028: Complete localization and per-domain OpenAPI

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-012
Depends on: BE-009, BE-013, BE-014, BE-016, BE-015, BE-017, BE-021, BE-023, BE-026, BE-027

## Goal

Ensure English/Persian lazy labels and complete domain-owned OpenAPI across all public endpoints.

## Allowed scope

- `backend/locale/`
- `backend/apps/*/api/v1/openapi.py`
- `backend/common/api/openapi.py`
- `backend/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-012-api-localization.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Audit all model/enum/serializer/permission messages for `gettext_lazy`.
2. Create English/Persian translations for P0 messages.
3. Complete per-domain OpenAPI annotations, examples, headers, error maps, operation IDs.
4. Generate and validate schema.
5. Test Accept-Language and canonical enum values.

## Acceptance criteria

- [ ] No domain endpoint lacks schema ownership file.
- [ ] Schema validates without unresolved warnings selected as errors.
- [ ] Persian errors/labels work while canonical values stay English codes.
- [ ] Examples contain synthetic data only.

## Verification commands

```bash
cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate
cd backend && python -m pytest tests/test_localization.py tests/test_openapi.py -q
```

## Out of scope

- Translating document contents.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
