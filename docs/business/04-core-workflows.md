# Core workflows

## WF-001: Create a legal case

1. An authorized user submits title, case type, priority, owner, description, dates, and involved parties.
2. The backend derives the organization from the active membership.
3. A service creates `Matter`, `LegalCase`, access for the owner, an activity log, and an outbox event in one transaction.
4. The API returns the new case.
5. The dashboard and permitted lists show the case.

## WF-002: Manage a contract renewal

1. An authorized user records effective, expiration, and renewal dates plus key terms.
2. The service validates date ordering.
3. A linked renewal deadline may be created explicitly by the user or by a simple documented rule.
4. Celery Beat identifies due reminder windows.
5. Notification delivery respects each recipient's channel preferences.

## WF-003: Intake a legal notice

1. A user records sender, received date, response deadline, status, and related matter if applicable.
2. The service creates the notice and a linked response deadline atomically.
3. The notice owner and assignee receive an in-app notification; email is sent if enabled.
4. The deadline appears in today/upcoming/overdue views according to organization timezone.

## WF-004: Complete a task or deadline

1. An authorized assignee or manager submits completion.
2. The service locks the record when concurrent completion is meaningful.
3. Status and completion timestamp are updated.
4. An activity log and outbox event are committed.
5. Repeated idempotent requests return the same completed state.

## WF-005: Direct document upload

1. The client requests an upload session for a permitted matter.
2. The backend checks authorization, file policy, quota, and rate limit.
3. The backend creates an upload session and short-lived presigned upload instructions.
4. The browser uploads directly to MinIO and reports local progress.
5. The client calls the completion endpoint.
6. The backend verifies the object from MinIO; a worker performs post-upload checks.
7. The browser reports byte progress locally; backend verification/processing/final status events are sent through the user WebSocket channel.
8. The client can poll the upload session if the socket is unavailable.
9. The final `Document` becomes downloadable only in `available` status.

## WF-006: Download a document

1. The client asks the backend for a download URL.
2. The selector verifies organization and matter access.
3. The backend writes a document-download activity entry.
4. The backend returns a short-lived presigned GET URL.
5. The URL is never logged by application code.

## WF-007: Reassign ownership

1. A manager chooses a new active member.
2. The backend previews affected matter, tasks, deadlines, and access.
3. The execute request includes an idempotency key and expected record version.
4. A service performs the transfer in a transaction.
5. Activity and outbox events are created before commit.

## WF-008: Offboard a user

1. An admin selects an active user and a replacement.
2. Preview lists owned matters, open tasks, open deadlines, and explicit access grants.
3. The admin confirms execution.
4. The service reassigns work, revokes access, deactivates membership, and records audit data atomically.
5. Notifications are dispatched after commit.
