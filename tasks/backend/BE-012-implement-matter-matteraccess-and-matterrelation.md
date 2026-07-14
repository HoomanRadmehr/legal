# BE-012: Implement Matter, MatterAccess, and MatterRelation

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-002, BE-003
Depends on: BE-008, BE-011

## Goal

Create the concrete shared Matter boundary and explicit access/relation models with no polymorphism.

## Allowed scope

- `backend/apps/matters/`
- `backend/apps/matters/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-002-organizations-permissions.md`, `specs/backend/BE-003-cases.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Matter with explicit organization, kind, title, reference, status, priority, owner, version, archive, and creator fields.
2. Create MatterAccess and MatterRelation with explicit foreign keys and constraints.
3. Implement permission-scoped `matter_list` and `matter_get` selectors.
4. Implement grant/revoke and owner-transfer service stubs or minimal operations required by later tasks.
5. Add database indexes for organization/reference/status/owner.

## Acceptance criteria

- [ ] Matter uses `CommonModel` as its only direct base.
- [ ] Case/contract/notice details will compose with Matter rather than inherit.
- [ ] Organization+reference is unique.
- [ ] Self and cross-organization relations are rejected.
- [ ] Visibility selectors pass role matrix tests.

## Verification commands

```bash
cd backend && python -m pytest apps/matters/tests -q
cd backend && python manage.py makemigrations --check --dry-run
python scripts/check_simplicity.py backend
```

## Out of scope

- Case/contract/notice detail fields.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
