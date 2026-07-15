# ADR-005: Presigned MinIO upload with direct document intents

- Status: Accepted
- Context: Large uploads should bypass Django while preserving authorization, status, and auditability.
- Decision: Django creates a pending `Document` after permission and policy checks, then returns short-lived presigned instructions. Completion is explicitly verified from MinIO before the document becomes available. Realtime status is sent through a user WebSocket, with REST polling fallback.
- Consequences: MinIO requires private buckets and CORS configuration. The backend must verify completion and clean expired pending documents.
- Rejected: Proxying all bytes through Django, public buckets, permanent object URLs, trusting client completion.
