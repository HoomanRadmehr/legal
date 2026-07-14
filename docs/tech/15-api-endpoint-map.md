# API endpoint map

All endpoints are under `/api/v1/` and use the standard error envelope.
This map is a navigation aid; domain specs and generated OpenAPI are authoritative.

| Domain | Method and path | Purpose | OpenAPI owner |
|---|---|---|---|
| Auth | `GET auth/csrf/` | Ensure CSRF cookie exists | accounts |
| Auth | `POST auth/login/` | Login and set refresh cookie | accounts |
| Auth | `POST auth/refresh/` | Rotate refresh and return access token | accounts |
| Auth | `POST auth/logout/` | Revoke/clear refresh | accounts |
| Auth | `GET auth/me/` | Current user and membership | accounts |
| Auth | `POST auth/ws-ticket/` | One-time WebSocket ticket | accounts |
| Memberships | `GET memberships/` | Admin/member choices according to role | organizations |
| Memberships | `PATCH memberships/{id}/` | Admin role/status update | organizations |
| Matter access | `GET matters/{id}/access/` | List active grants | matters |
| Matter access | `POST matters/{id}/grant-access/` | Grant view/edit | matters |
| Matter access | `POST matters/{id}/revoke-access/` | Revoke grant | matters |
| Cases | `GET/POST cases/` | List/create | cases |
| Cases | `GET/PATCH cases/{id}/` | Detail/update | cases |
| Cases | `POST cases/{id}/archive/` | Archive without hard delete | cases |
| Cases | `GET cases/{id}/timeline/` | Case activity | cases/activity |
| Contracts | `GET/POST contracts/` | List/create | contracts |
| Contracts | `GET/PATCH contracts/{id}/` | Detail/update | contracts |
| Contracts | `POST contracts/{id}/archive/` | Archive | contracts |
| Contracts | `GET contracts/{id}/timeline/` | Contract activity | contracts/activity |
| Notices | `GET/POST notices/` | List/intake | notices |
| Notices | `GET/PATCH notices/{id}/` | Detail/update | notices |
| Notices | `POST notices/{id}/archive/` | Archive | notices |
| Notices | `GET notices/{id}/timeline/` | Notice activity | notices/activity |
| Deadlines | `GET/POST deadlines/` | List/create; supports required views | deadlines |
| Deadlines | `GET/PATCH deadlines/{id}/` | Detail/update | deadlines |
| Deadlines | `POST deadlines/{id}/complete/` | Idempotent completion | deadlines |
| Deadlines | `POST deadlines/{id}/cancel/` | Idempotent cancellation | deadlines |
| Tasks | `GET/POST tasks/` | List/create | tasks |
| Tasks | `GET/PATCH tasks/{id}/` | Detail/update | tasks |
| Tasks | `POST tasks/{id}/complete/` | Complete | tasks |
| Tasks | `POST tasks/{id}/cancel/` | Cancel | tasks |
| Uploads | `POST documents/uploads/` | Initiate presigned upload | documents |
| Uploads | `GET documents/uploads/{id}/` | Poll upload state | documents |
| Uploads | `POST documents/uploads/{id}/complete/` | Verify/schedule processing | documents |
| Uploads | `POST documents/uploads/{id}/cancel/` | Cancel pending upload | documents |
| Documents | `GET documents/` | Permission-scoped list | documents |
| Documents | `GET documents/{id}/` | Metadata/status | documents |
| Documents | `POST documents/{id}/download-url/` | Audited short-lived download | documents |
| Documents | `POST documents/{id}/revoke/` | Revoke availability | documents |
| Activity | `GET activity/` | Permission-scoped activity | activity |
| Dashboard | `GET dashboard/` | Permission-aware summary | dashboard |
| Notifications | `GET notifications/` | Recipient list | notifications |
| Notifications | `PATCH notifications/{id}/read/` | Mark one read | notifications |
| Notifications | `POST notifications/read-all/` | Mark all read | notifications |
| Preferences | `GET notification-preferences/` | Own preferences | notifications |
| Preferences | `PUT notification-preferences/` | Replace/update own preferences | notifications |
| Offboarding | `POST offboarding/preview/` | Admin read-only preview | offboarding |
| Offboarding | `POST offboarding/execute/` | Admin atomic execute | offboarding |
| Offboarding | `GET offboarding/{run_id}/` | Run status/result | offboarding |
| Health | `GET /health/live/` | Liveness outside API namespace | common |
| Health | `GET /health/ready/` | Readiness outside API namespace | common |

## Standard headers

- `Authorization: Bearer <access-token>` on protected REST endpoints.
- `X-CSRFToken: <csrf-cookie-value>` on login, refresh, logout, and other cookie-changing endpoints.
- `Accept-Language: en|fa` for localized messages.
- `Idempotency-Key: <uuid>` on upload completion, offboarding execute, and other explicitly documented critical writes.
- `X-Request-ID` may be supplied; the server returns the effective value.

## WebSocket

```text
GET /ws/v1/events/?ticket=<one-time-ticket>
```

The query ticket is short-lived, single-use, and redacted from logs. The server selects the user group; the client cannot subscribe to arbitrary groups.
