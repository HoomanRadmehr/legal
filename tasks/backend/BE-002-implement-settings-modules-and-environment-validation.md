# BE-002: Implement settings modules and environment validation

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000
Depends on: BE-001

## Goal

Create base/development/production/test settings with one shared environment key set and hardcoded secure production behavior.

## Allowed scope

- `backend/config/settings/`
- `backend/config/env.py`
- `backend/tests/`
- `backend/README.md`
- `.env.example`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-000-foundation.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement a small environment reader with explicit required values and safe errors.
2. Configure installed apps, database, cache, DRF, localization, and static basics in base settings.
3. Set development debug and local behavior in `development.py`.
4. Hardcode production debug false, secure cookies, HTTPS/HSTS/header behavior, and explicit host/origin inputs.
5. Create isolated fast test settings.
6. Add tests for selection and missing/unsafe production values.

## Acceptance criteria

- [x] Production cannot start with debug enabled or wildcard hosts.
- [x] Security invariants are not optional env booleans.
- [x] No secret value appears in validation errors.
- [x] Tests prove development/production differences.

## Verification commands

```bash
cd backend && python -m pytest tests/test_settings.py -q
cd backend && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py check --deploy
```

## Out of scope

- Domain models or provider credentials.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `backend/config/env.py`, `backend/config/settings/base.py`, `backend/config/settings/development.py`, `backend/config/settings/production.py`, `backend/config/settings/test.py`, `backend/tests/__init__.py`, `backend/tests/test_settings.py`, `backend/README.md`, `.env.example`, `tasks/backend/BE-002-implement-settings-modules-and-environment-validation.md`, `AI_USAGE.md`
- Commands run:
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m pytest tests/test_settings.py -q'`
  - With required production env values exported and not logged: `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py check --deploy'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m compileall .'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" python scripts/check_simplicity.py backend`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m ruff check .'`
- Result: Passed. Settings tests reported `4 passed`; Django deploy check reported no issues; compile, simplicity, and Ruff checks passed.
- Deviations/questions: No unresolved questions. The host `python` shim still points to a missing pyenv global `3.12`, so verification used the existing temporary Python 3.12 virtual environment on `PATH`.
