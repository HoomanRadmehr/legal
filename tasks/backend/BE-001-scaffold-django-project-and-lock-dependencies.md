# BE-001: Scaffold Django project and lock dependencies

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000
Depends on: none

## Goal

Create the minimal Django/DRF project and dependency lock without implementing domain behavior.

## Allowed scope

- `backend/pyproject.toml`
- `backend/uv.lock or approved lock file`
- `backend/manage.py`
- `backend/config/`
- `backend/common/`
- `backend/apps/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-000-foundation.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create the Django project under `backend/` with `config`, `common`, and `apps` packages.
2. Declare only approved runtime/development dependencies from the dependency policy.
3. Commit a reproducible lock file.
4. Configure pytest and Ruff with small standard settings.
5. Add placeholder app package READMEs rather than generating all domain code.

## Acceptance criteria

- [x] Django starts with the test settings.
- [x] Dependency install is reproducible from the lock file.
- [x] No domain model or generic framework is generated.
- [x] Ruff and pytest smoke commands succeed.

## Verification commands

```bash
cd backend && python -m compileall .
cd backend && python -m pytest -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Settings security behavior, Docker, and domain models.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `backend/pyproject.toml`, `backend/uv.lock`, `backend/manage.py`, `backend/config/`, `backend/common/`, `backend/apps/`, `tasks/backend/BE-001-scaffold-django-project-and-lock-dependencies.md`, `AI_USAGE.md`
- Commands run:
  - `uv lock`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-001-venv uv sync --all-groups --python /usr/bin/python3.12`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m compileall .'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m pytest -q'`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" python scripts/check_simplicity.py backend`
  - `PATH="/tmp/legal-be-001-venv/bin:$PATH" bash -c 'cd backend && python -m ruff check .'`
  - `UV_PROJECT_ENVIRONMENT=/tmp/legal-be-001-venv uv sync --locked --all-groups --python /usr/bin/python3.12`
- Result: Passed. Django starts under `config.settings.test`; pytest reported `1 passed`; Ruff and simplicity checks passed; lock-file sync succeeded.
- Deviations/questions: No unresolved questions. The host `python` shim points to a missing pyenv global `3.12`, so verification used a temporary Python 3.12 virtual environment on `PATH` without adding environment files to the repository.
