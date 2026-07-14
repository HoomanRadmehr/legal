# Demonstration script

This script covers the evaluation rubric in approximately 8-10 minutes and leaves time for architecture and AI workflow discussion.

## 1. Authentication and roles

- Login as Viewer and show read-only navigation.
- Attempt a direct edit route and show safe denial.
- Login as Legal Manager and show organization-wide permitted views.

## 2. Case, contract, and notice

- Create a case with parties and show the activity timeline.
- Open a contract with renewal/expiration dates.
- Intake a notice and show that its response deadline appears in the common deadline list.

## 3. Deadline risk

- Show Today, Overdue, Upcoming, and Assigned-to-me tabs.
- Complete one deadline and show the audited status change.
- Mention organization-timezone boundary tests.

## 4. Secure document flow

- Initiate a document upload from a permitted matter.
- Show browser-to-MinIO progress, then verifying/processing status.
- Disconnect/reconnect the realtime connection or explain polling fallback.
- Download through a fresh backend-issued URL.
- Explain that the bucket is private and the URL is never logged.

## 5. Notifications

- Show per-user email/in-app/SMS/push preferences.
- Trigger an in-app notification.
- Show that unconfigured SMS/push are marked skipped, not falsely successful.

## 6. Dashboard and audit

- Show permission-aware counts.
- Compare Viewer versus Manager dashboard scope.
- Show recent activity and request/actor/timestamp evidence.

## 7. Offboarding

- Preview a departing Counsel's owned matters, tasks, deadlines, and grants.
- Execute with confirmation and show reassigned work.
- Explain transaction rollback and idempotency tests.

## 8. Engineering evidence

- Show OpenAPI generated from domain-owned declarations.
- Show the role/organization security tests.
- Show Docker setup, seed command, and CI.
- Show `AI_USAGE.md`, including two AI mistakes and human corrections.
