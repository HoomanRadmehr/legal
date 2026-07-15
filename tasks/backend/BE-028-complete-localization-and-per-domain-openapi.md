# BE-028: Complete localization and per-domain OpenAPI

Status: DONE
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

- [x] No domain endpoint lacks schema ownership file.
- [x] Schema validates without unresolved warnings selected as errors.
- [x] Persian errors/labels work while canonical values stay English codes.
- [x] Examples contain synthetic data only.

## Verification commands

```bash
cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate
cd backend && python -m pytest tests/test_localization.py tests/test_openapi.py -q
```

## Out of scope

- Translating document contents.

## Codex execution log

- Started: 2026-07-15 16:30 +0330
- Completed: 2026-07-15 16:39 +0330
- Files changed:
  - `backend/config/settings/base.py`
  - `backend/common/api/openapi.py`
  - `backend/locale/en/LC_MESSAGES/django.po`
  - `backend/locale/en/LC_MESSAGES/django.mo`
  - `backend/locale/fa/LC_MESSAGES/django.po`
  - `backend/locale/fa/LC_MESSAGES/django.mo`
  - `backend/tests/test_localization.py`
  - `backend/tests/test_openapi.py`
  - `tasks/backend/BE-028-complete-localization-and-per-domain-openapi.md`
  - `AI_USAGE.md`
- Commands run:
  - `python3` one-off `.po` to `.mo` compiler - generated GNU message catalogs because local `msgfmt` is unavailable.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be028-venv uv run --python /usr/bin/python3.12 python -m pytest tests/test_localization.py tests/test_openapi.py -q` - passed, 5 tests.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be028-venv uv run --python /usr/bin/python3.12 ruff check config/settings/base.py common/api/openapi.py tests/test_localization.py tests/test_openapi.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be028-venv uv run --python /usr/bin/python3.12 ruff format --check config/settings/base.py common/api/openapi.py tests/test_localization.py tests/test_openapi.py` - passed.
  - `mkdir -p build && cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate` - failed before Django startup because `.python-version` points to unavailable pyenv `3.12`.
  - `cd backend && python -m pytest tests/test_localization.py tests/test_openapi.py -q` - failed before pytest startup because `.python-version` points to unavailable pyenv `3.12`.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be028-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file ../build/openapi.yaml --validate` - initially reported two enum naming warnings, then passed with no warnings or errors after explicit enum name overrides.
  - `python3 scripts/check_simplicity.py` - passed, scanned 505 source files.
  - `python3 scripts/validate_docs.py` - failed on pre-existing invalid task heading IDs in decimal task files outside BE-028 scope.
- Result: DONE. Added project locale catalogs, wired `LOCALE_PATHS`, documented localized error and standard language/idempotency/rate-limit headers in common OpenAPI, stabilized generated enum component names, generated `build/openapi.yaml`, and added tests for Persian error/label behavior, canonical enum stability, OpenAPI ownership, operation IDs, and synthetic examples.
- Deviations/questions: `backend/config/settings/base.py` is outside the task's written allowed scope, but the setting was required for Django to load `backend/locale/` at runtime. Exact `python ...` verification commands are blocked by the repository pyenv configuration; equivalent `/usr/bin/python3.12` uv-backed commands passed. Documentation validation remains blocked by existing invalid decimal task heading IDs in `BE-026.-8`, `BE-026.5`, `BE-026.75`, `FE-013.5`, `FE-013.75`, and `FE-013.8`.
