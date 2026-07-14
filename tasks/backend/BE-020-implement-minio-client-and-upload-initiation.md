# BE-020: Implement MinIO client and upload initiation

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-007
Depends on: BE-012, BE-018, BE-019, BE-010

## Goal

Create private storage client boundaries, UploadSession, and permission/rate-limited presigned initiation.

## Allowed scope

- `backend/common/storage/`
- `backend/apps/documents/models.py`
- `backend/apps/documents/services.py`
- `backend/apps/documents/api/v1/`
- `backend/apps/documents/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-007-documents-uploads.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement small MinIO client functions for stat, presign, and delete abandoned object.
2. Create UploadSession state/fields and explicit transition validation.
3. Implement initiate service with matter edit permission, file policy, size, rate, expiry, random key.
4. Return presigned method/URL/headers/fields without persisting URL.
5. Add status polling endpoint and OpenAPI.

## Acceptance criteria

- [x] Bucket/public policy is not controlled by request.
- [x] Object key is UUID-based and filename-safe.
- [x] Oversize/type/rate violations use stable errors.
- [x] Presigned URL is not logged or stored.
- [x] Viewer/cross-org initiate is denied.

## Verification commands

```bash
cd backend && python -m pytest apps/documents/tests -q
```

## Out of scope

- Completion, Document creation, and realtime consumer.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 21:22:36 +0330
- Files changed:
  - `backend/common/storage/__init__.py`
  - `backend/common/storage/minio.py`
  - `backend/common/api/throttles.py`
  - `backend/config/settings/base.py`
  - `backend/config/urls.py`
  - `backend/apps/documents/__init__.py`
  - `backend/apps/documents/apps.py`
  - `backend/apps/documents/models.py`
  - `backend/apps/documents/selectors.py`
  - `backend/apps/documents/services.py`
  - `backend/apps/documents/migrations/__init__.py`
  - `backend/apps/documents/migrations/0001_initial.py`
  - `backend/apps/documents/api/v1/__init__.py`
  - `backend/apps/documents/api/v1/openapi.py`
  - `backend/apps/documents/api/v1/serializers.py`
  - `backend/apps/documents/api/v1/urls.py`
  - `backend/apps/documents/api/v1/viewsets.py`
  - `backend/apps/documents/tests/__init__.py`
  - `backend/apps/documents/tests/factories.py`
  - `backend/apps/documents/tests/test_upload_api.py`
  - `backend/apps/documents/tests/test_upload_services.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-020-implement-minio-client-and-upload-initiation.md`
- Commands run:
  - `cd backend && python -m pytest apps/documents/tests -q` (failed before pytest because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations documents`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 python -m pytest apps/documents/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 ruff format apps/documents common/storage/minio.py common/storage/__init__.py common/api/throttles.py config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 ruff format --check apps/documents common/storage/minio.py common/storage/__init__.py common/api/throttles.py config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 ruff check apps/documents common/storage/minio.py common/storage/__init__.py common/api/throttles.py config/settings/base.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with local PostgreSQL authentication warning)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be020-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be020-schema.yaml --validate` (passed with one enum-name warning)
  - `python3 scripts/check_simplicity.py`
  - `python3 scripts/validate_docs.py`
- Result: DONE; implemented the MinIO storage boundary, upload session model, initiation and polling API, explicit permission and upload policy checks, UUID-based object keys, upload initiation throttle, and focused service/API tests.
- Deviations/questions: The task's allowed scope omitted `backend/config/settings/base.py`, `backend/config/urls.py`, and `backend/common/api/throttles.py`, but the app registration, URL routing, and explicit upload-initiate throttle were required to publish the documented endpoint. No presigned URL is persisted or written to activity/outbox payloads.
