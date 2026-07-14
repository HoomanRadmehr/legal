# BE-034: Final backend acceptance verification

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-030, BE-031, BE-032, BE-033

## Goal

Run the complete backend acceptance gate and leave a reproducible result record.

## Allowed scope

- `backend/`
- `build/`
- `tasks/backend/BE-034-final-backend-acceptance.md`
- `AI_USAGE.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Run docs and simplicity checks.
2. Run full backend lint/test/migration/OpenAPI/deploy checks.
3. Build development and production images.
4. Start integration services and run smoke flow where feasible.
5. Record exact results and unresolved limitations.
6. Do not start frontend fixes in this task.

## Acceptance criteria

- [ ] Every required command passes or a real blocking failure is documented without claiming completion.
- [ ] No pending migration or invalid schema.
- [ ] Production settings deploy check passes with safe test values.
- [ ] Task log contains exact evidence.

## Verification commands

```bash
python scripts/validate_docs.py
python scripts/check_simplicity.py backend
cd backend && python -m ruff check .
cd backend && python -m pytest -q
cd backend && python manage.py makemigrations --check --dry-run
cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate
docker compose config
```

## Out of scope

- New feature implementation.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
