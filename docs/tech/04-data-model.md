# Data model

This is the target logical schema. Individual specs define field details and migrations.

## Identity and organization

### User

- UUID primary key
- username/email fields according to the selected login identifier
- first/last name
- preferred language
- active flag
- timestamps

The custom user inherits only Django `AbstractUser`.

### Organization

- UUID
- name
- timezone
- default language
- active flag
- timestamps

### Membership

- UUID
- organization FK
- user FK
- role: `legal_admin`, `legal_manager`, `legal_counsel`, `viewer`
- status: `active`, `suspended`, `offboarded`
- joined_at / offboarded_at
- unique organization + user

## Matter and access

### Matter

- UUID
- organization FK
- kind: `case`, `contract`, `notice`
- title
- reference_code
- status
- priority
- owner membership FK
- description
- opened_on / closed_on as relevant
- version
- archived_at / archived_by optional
- created_by membership FK
- timestamps

Constraints:

- organization + reference_code unique;
- owner belongs to same organization, validated in service;
- version positive;
- archived record remains queryable to authorized users through explicit filters.

### MatterAccess

- UUID
- organization FK
- matter FK
- membership FK
- level: `view`, `edit`
- granted_by membership FK
- revoked_at optional
- unique active grant per matter + membership

### MatterRelation

- UUID
- organization FK
- source matter FK
- target matter FK
- relation type
- timestamps
- no self-relation

## Detail tables

### LegalCase

- one-to-one Matter primary key
- case_type
- court_or_authority optional
- filing_date optional
- outcome summary optional

### CaseParty

- UUID
- organization FK
- case FK
- name
- role
- contact summary optional

### Contract

- one-to-one Matter primary key
- contract_type
- counterparty
- effective_date
- expiration_date optional
- renewal_date optional
- key_terms JSON object with documented size limit

### LegalNotice

- one-to-one Matter primary key
- sender
- received_date
- response_deadline
- response_status
- linked response Deadline FK after creation if retained as explicit link

## Work records

### Deadline

- UUID
- organization FK
- matter FK
- title / description
- due_at
- assignee membership FK
- status: `open`, `completed`, `cancelled`
- priority
- reminder_enabled
- completed_at / completed_by
- version
- timestamps

### Task

- UUID
- organization FK
- matter FK
- title / description
- assignee membership FK
- due_at optional
- status: `todo`, `in_progress`, `done`, `cancelled`
- completed_at
- version
- timestamps

## Documents

### Document

- UUID
- organization FK
- matter FK
- object_key unique
- original_filename
- content_type
- expected_size
- actual_size optional
- expected_checksum optional
- actual_checksum optional
- ETag optional
- status: `pending_upload`, `verifying`, `available`, `failed`, `expired`, `cancelled`
- description
- uploaded_by membership FK
- upload_expires_at optional
- uploaded_at optional
- failure_code optional
- timestamps

## Audit and reliability

### ActivityLog

- UUID
- organization FK
- matter FK optional for organization-level actions
- actor membership/user nullable for system actions
- action code
- target_type enum/string
- target_id UUID optional
- before_values redacted JSON
- after_values redacted JSON
- metadata safe JSON
- request_id
- created_at

### OutboxEvent

- UUID
- organization FK optional
- event_type
- event_version
- aggregate_type
- aggregate_id
- payload JSON
- available_at
- published_at
- attempt_count
- last_error_code
- created_at

### IdempotencyRecord

- UUID
- organization FK
- actor user/membership FK
- scope
- key hash
- request hash
- response status and safe response body
- expires_at
- unique organization + actor + scope + key hash

## Notifications

### NotificationPreference

- UUID
- membership FK
- event_type
- channel: `in_app`, `email`, `sms`, `push`
- enabled
- reminder_offset_minutes optional
- unique membership + event_type + channel + offset

### Notification

- UUID
- organization FK
- recipient membership FK
- event_type
- matter FK optional
- title key / rendered title according to chosen policy
- body key / rendered body
- read_at
- created_at

### NotificationDelivery

- UUID
- notification FK
- channel
- status: `pending`, `sent`, `failed`, `skipped`
- attempt_count
- provider_message_id optional
- last_error_code optional
- deduplication_key unique
- sent_at
- timestamps

## Offboarding

### OffboardingRun

- UUID
- organization FK
- departing membership FK
- replacement membership FK
- initiated_by membership FK
- status
- preview_snapshot safe JSON
- idempotency key reference
- executed_at
- failure_code
- timestamps
