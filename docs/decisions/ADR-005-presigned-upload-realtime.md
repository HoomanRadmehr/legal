# ADR-005: Presigned MinIO upload with persisted upload sessions

- Status: Accepted
- Context: Large uploads should bypass Django while preserving authorization, status, and auditability.
- Decision: Django creates an `UploadSession` after permission and policy checks, then returns short-lived presigned instructions. Completion is explicitly verified from MinIO. Realtime status is sent through a user WebSocket, with REST polling fallback.
- Consequences: MinIO requires private buckets and CORS configuration. The backend must verify completion and clean expired sessions.
- Rejected: Proxying all bytes through Django, public buckets, permanent object URLs, trusting client completion.
