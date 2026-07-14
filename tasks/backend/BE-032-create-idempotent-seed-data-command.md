# BE-032: Create idempotent seed data command

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-013, BE-014, BE-016, BE-015, BE-017, BE-023

## Goal

Create safe demonstration data for every role, domain, required deadline view, and organization isolation.

## Allowed scope

- `backend/apps/*/management/commands/`
- `backend/tests/test_seed.py`
- `backend/README.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement one idempotent seed command using services or carefully scoped creation helpers.
2. Create two organizations and all four roles.
3. Create visible/hidden matters, contracts, notices, deadlines for today/upcoming/overdue, tasks, preferences, and activity.
4. Use only synthetic names/content and documented demo passwords.
5. Test running command twice.

## Acceptance criteria

- [ ] Second run does not duplicate records.
- [ ] Seed demonstrates cross-organization isolation and every required screen.
- [ ] No real personal/legal data is present.
- [ ] Credentials are clearly development-only.

## Verification commands

```bash
cd backend && python manage.py seed_demo
cd backend && python manage.py seed_demo
cd backend && python -m pytest tests/test_seed.py -q
```

## Out of scope

- Large performance dataset.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
