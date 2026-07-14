# Roles and permissions

## Roles

### Legal Admin

- Manage organization memberships and roles.
- View and manage all matters in the organization.
- Grant or revoke matter access.
- Perform reassignment and offboarding.
- View audit logs.
- Configure system-level notification defaults.

### Legal Manager

- View all matters in the organization.
- Create and update matters.
- Assign and reassign owners, tasks, and deadlines.
- Grant matter access where permitted.
- View audit logs for organization matters.
- Cannot manage Legal Admin membership or erase audit history.

### Legal Counsel / Case Lead

- View matters they own or have explicit access to.
- Update matters they can edit.
- Create and manage linked tasks, deadlines, and documents where access allows.
- Reassign only their own tasks unless a manager grants broader authority.
- Cannot perform bulk offboarding or organization administration.

### Viewer

- Read matters explicitly shared with them.
- Read linked tasks, deadlines, activity, and document metadata where allowed.
- Download a document only when their matter access includes document access.
- Cannot create, update, reassign, upload, or change preferences for another user.

## Permission matrix

Legend: `A` allowed organization-wide, `M` allowed for owned/explicitly editable matters, `R` read-only for explicitly shared matters, `-` denied.

| Capability | Admin | Manager | Counsel | Viewer |
|---|---:|---:|---:|---:|
| View organization dashboard | A | A | M | R |
| Create case/contract/notice | A | A | A | - |
| View matter | A | A | M | R |
| Update matter | A | A | M | - |
| Archive matter | A | A | M, owner only | - |
| Change matter owner | A | A | - | - |
| Grant/revoke matter access | A | A | M, owner only | - |
| Create task/deadline | A | A | M | - |
| Reassign another user's task/deadline | A | A | - | - |
| Upload document | A | A | M | - |
| Download document | A | A | M | R, when document access is allowed |
| View activity log | A | A | M | R, redacted as required |
| Configure own notifications | A | A | A | A |
| Configure another user's notifications | A | - | - | - |
| Run offboarding | A | - | - | - |
| Manage membership/roles | A | - | - | - |

## Enforcement rules

- Permissions are evaluated on the backend for every request.
- Frontend guards exist only to improve user experience.
- Organization membership must be active.
- Matter-level visibility is applied in the queryset before retrieving a record.
- Owner access does not override a disabled membership.
- An unauthorized lookup of a confidential record should generally return `404`.
- Admin authority never permits editing or deleting append-only audit history through the API.
