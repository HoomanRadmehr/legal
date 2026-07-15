# BE-040: Separate internal and public MinIO endpoints

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-007, BE-013
Depends on: BE-035, BE-039

## Goal

Separate server-side MinIO operations from browser-facing presigned URL generation.

The backend must use the internal Compose/service endpoint for bucket checks, object stat,
completion verification, deletion, cleanup, and any other server-to-MinIO operation. Presigned
upload and download URLs must be signed for the final public endpoint returned to the client.

## Allowed scope

- Backend settings and storage helper code.
- Docker/Compose MinIO environment configuration.
- Backend README and environment documentation.
- Focused backend tests for settings/storage behavior.
- Task metadata, INT-004 dependency tracking, traceability references, and AI usage evidence.

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `infra/AGENTS.md`
- `CODEX_START_HERE.md`
- `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
- `specs/backend/BE-007-documents-uploads.md`
- `specs/backend/BE-013-security-deployment.md`
- `docs/guardrails/02-security.md`
- `docs/guardrails/06-realtime-and-upload.md`
- `docs/tech/06-minio-upload.md`
- `docs/tech/11-environments-settings.md`
- `docs/tech/12-docker.md`

## Implementation steps

1. Add explicit settings for the internal MinIO endpoint and signing region while preserving the existing endpoint name as a compatibility alias.
2. Use the internal endpoint for server-side MinIO operations.
3. Use only the public endpoint for presigned upload and download URLs.
4. Configure Compose so local browser development keeps `http://localhost:9000` and `api-test` receives a MinIO URL reachable from inside the Compose network.
5. Configure production to require an external HTTPS public MinIO endpoint.
6. Keep MinIO credentials out of frontend-visible responses and logs.

## Acceptance criteria

- [x] API server-side MinIO operations use the internal endpoint.
- [x] Presigned upload and download URLs are signed for the configured public endpoint.
- [x] Presign creation does not need to contact `localhost:9000` from inside the API container.
- [x] Compose integration tests receive a public URL reachable from `api-test`.
- [x] Local browser development can still use `http://localhost:9000`.
- [x] Production supports an external HTTPS storage hostname.
- [x] Completion still verifies the object through internal MinIO stat.
- [x] Presigned URLs and MinIO credentials are not persisted in activity or outbox payloads.

## Verification commands

```bash
docker compose config
docker compose build api api-test
docker compose up -d postgres redis rabbitmq minio minio-init api
docker compose ps
docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q
python3 scripts/check_simplicity.py
python3 scripts/validate_docs.py
```

## Out of scope

- Changing document permissions, JWT, cookies, CSRF, or document state rules.
- Making the MinIO bucket public.
- Rewriting hosts after a URL has already been signed.

## Codex execution log

- Started: 2026-07-15 21:13 +0330
- Completed: 2026-07-15 21:22 +0330
- Files changed:
  - `backend/config/settings/base.py`
  - `backend/config/settings/production.py`
  - `backend/common/storage/minio.py`
  - `backend/tests/test_settings.py`
  - `.env.example`
  - `compose.yaml`
  - `compose.production.yaml`
  - `backend/README.md`
  - `docs/tech/06-minio-upload.md`
  - `docs/tech/11-environments-settings.md`
  - `specs/backend/BE-007-documents-uploads.md`
  - `docs/traceability/matrix.md`
  - `tasks/INDEX.md`
  - `tasks/ORDER.md`
  - `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && uv lock` - passed; locked Daphne runtime dependency as part of the paired ASGI repair.
  - `cd backend && uv run --group test python -m pytest tests/test_settings.py apps/activity/tests/test_outbox_dispatcher.py common/realtime/tests/test_user_events.py -q` - passed, 19 tests.
  - `cd backend && uv run --group dev ruff check common/storage/minio.py common/services/outbox.py apps/documents/services.py tests/test_settings.py apps/activity/tests/test_outbox_dispatcher.py` - passed.
  - `cd backend && MINIO_PUBLIC_ENDPOINT=http://localhost:9000 MINIO_INTERNAL_ENDPOINT=minio:9000 MINIO_REGION=us-east-1 uv run --group test python - <<'PY' ...` - passed; generated a localhost presigned URL without connecting to localhost.
  - `docker compose config` - passed; `api` renders `MINIO_PUBLIC_ENDPOINT=http://localhost:9000`, while `api-test` renders `MINIO_PUBLIC_ENDPOINT=http://minio:9000`.
  - `docker compose build api api-test` - passed.
  - `docker compose up -d postgres redis rabbitmq minio minio-init api` - passed.
  - `docker compose ps` - passed; API started with the Daphne command and became healthy.
  - `docker compose run --rm api-test python - <<'PY' ...` - passed; public endpoint was `http://minio:9000`, upload returned `200`, and internal stat reported the expected object size.
  - `docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q` - passed after paired INT-004 harness corrections; 2 tests.
  - `python3 scripts/check_simplicity.py` - passed, scanned 530 source files.
  - `python3 scripts/validate_docs.py` - passed, validated 27 specs, 74 tasks, and 184 Markdown files.
- Result: DONE. Added `MINIO_INTERNAL_ENDPOINT` and `MINIO_REGION`, preserved `MINIO_ENDPOINT` as the compatibility alias, kept local browser signing on `http://localhost:9000`, configured `api-test` signing on `http://minio:9000`, and kept production ready for an HTTPS `MINIO_PUBLIC_ENDPOINT`.
- Deviations/questions: Existing INT-004 helper code still opens presigned MinIO URLs by connecting to the internal endpoint while preserving the signed `Host` header; no product code rewrites signed URLs. A separate api-test MinIO smoke verified direct upload through the final signed `http://minio:9000` endpoint.
