# BE-021: Implement upload completion, processing, document list/download

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-007
Depends on: BE-020, BE-018, BE-019

## Goal

Verify direct uploads from MinIO, create available Document metadata asynchronously, and issue audited download URLs.

## Allowed scope

- `backend/apps/documents/`
- `backend/common/storage/`
- `backend/apps/documents/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-007-documents-uploads.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Document model.
2. Implement idempotent complete service with exact state/key/expiry/stat/size/content checks.
3. Schedule worker after commit; worker re-verifies and marks available/failed.
4. Implement permission-scoped document list/detail.
5. Implement audited short-lived download URL and revoke action.
6. Implement expired session cleanup job.

## Acceptance criteria

- [x] Client completion claims are never trusted.
- [x] Document is downloadable only when available.
- [x] Download URL is never logged/activity-stored.
- [x] Cleanup cannot remove available documents.
- [x] Duplicate completion is safe and conflicting replay fails.

## Verification commands

```bash
cd backend && python -m pytest apps/documents/tests -q
```

## Out of scope

- Antivirus/OCR or real content extraction.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 21:31:58 +0330
- Files changed:
  - `backend/common/storage/__init__.py`
  - `backend/common/storage/minio.py`
  - `backend/apps/documents/models.py`
  - `backend/apps/documents/selectors.py`
  - `backend/apps/documents/services.py`
  - `backend/apps/documents/tasks.py`
  - `backend/apps/documents/migrations/0002_document.py`
  - `backend/apps/documents/api/v1/openapi.py`
  - `backend/apps/documents/api/v1/serializers.py`
  - `backend/apps/documents/api/v1/urls.py`
  - `backend/apps/documents/api/v1/viewsets.py`
  - `backend/apps/documents/tests/factories.py`
  - `backend/apps/documents/tests/test_document_services.py`
  - `backend/apps/documents/tests/test_upload_api.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-021-implement-upload-completion-processing-document-list-download.md`
- Commands run:
  - `cd backend && python -m pytest apps/documents/tests -q` (failed before pytest because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations documents`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 python -m pytest apps/documents/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 ruff format apps/documents common/storage/minio.py common/storage/__init__.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 ruff check apps/documents common/storage/minio.py common/storage/__init__.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 ruff format --check apps/documents common/storage/minio.py common/storage/__init__.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with local PostgreSQL authentication warning)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be021-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be021-schema.yaml --validate` (passed with one enum-name warning)
  - `python3 scripts/check_simplicity.py`
  - `python3 scripts/validate_docs.py`
- Result: DONE; implemented idempotent upload completion, MinIO object verification, post-commit processing task scheduling, available Document metadata creation, permission-scoped document list/detail, audited short-lived download URLs, document revoke, and expired upload cleanup.
- Deviations/questions: The literal verification command cannot run in this workspace because local pyenv points to an uninstalled `3.12`; the same test target passed with `/usr/bin/python3.12` through `uv`. OpenAPI validation reports one enum-name warning for repeated `status` fields and no schema errors. BE-021 avoided adding upload-complete/download throttle classes because its allowed scope does not include `backend/common/api/throttles.py`.
