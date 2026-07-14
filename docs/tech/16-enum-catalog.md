# Canonical enum catalog

These are initial canonical values for the MVP. Labels are localized; stored/API values are not translated.
A domain task may add a value only when its spec and OpenAPI are updated.

## Identity and access

```text
MembershipRole: legal_admin, legal_manager, legal_counsel, viewer
MembershipStatus: active, suspended, offboarded
MatterAccessLevel: view, edit
```

## Matter

```text
MatterKind: case, contract, notice
Priority: low, normal, high, critical
```

Status values are explicit by domain even though the canonical field is stored on Matter:

```text
CaseStatus: open, pending, on_hold, closed, archived
ContractStatus: draft, active, expired, terminated, archived
NoticeStatus: received, under_review, response_due, responded, closed, archived
```

A service validates that a status belongs to the Matter kind. Do not create a polymorphic status framework.

## Work

```text
DeadlineStatus: open, completed, cancelled
TaskStatus: todo, in_progress, done, cancelled
```

## Uploads and documents

```text
UploadStatus: initiated, verifying, processing, available, failed, expired, cancelled
DocumentStatus: processing, available, failed, revoked
```

The browser displays `uploading` as a local UI state from transfer progress. It is not a persisted server status. The authoritative server states begin at initiation and continue through verification, processing, and final outcomes.

## Notifications

```text
NotificationChannel: in_app, email, sms, push
DeliveryStatus: pending, sent, failed, skipped
```

## Offboarding

```text
OffboardingStatus: previewed, executing, completed, failed
```

## Activity

Activity action codes use dot-separated stable values, such as:

```text
case.created
case.updated
matter.archived
matter.owner_changed
matter.access_granted
matter.access_revoked
contract.created
contract.updated
notice.created
notice.response_deadline_changed
deadline.created
deadline.completed
task.created
task.completed
document.upload_initiated
document.upload_completed
document.available
document.download_requested
offboarding.executed
```
