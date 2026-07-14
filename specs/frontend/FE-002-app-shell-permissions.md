# FE-002: App shell and permission-aware navigation

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-001, BE-002 contract
- Depends on: FE-001

## Intent

Show a consistent application shell and hide or disable controls the current role cannot use, while treating backend authorization as authoritative.

## Shell

- Main navigation for dashboard, cases, contracts, notices, deadlines, tasks, documents, activity, notifications, and admin/offboarding where allowed.
- Responsive header/sidebar.
- User and organization identity.
- Locale switcher.
- Global notification indicator.

## Permission helpers

Use a small explicit set of pure functions, for example:

```typescript
canCreateMatter(role)
canManageOrganization(role)
canRunOffboarding(role)
canEditOwnedMatter(role, accessLevel, isOwner)
```

Do not create a policy language, permission matrix engine, or component inheritance hierarchy.
Backend `403/404` responses remain authoritative and are handled gracefully.

## Route behavior

- Admin-only routes are absent/redirected for other roles.
- Read-only Viewer controls are hidden or disabled with a clear reason.
- A direct URL to a hidden page still calls the backend and handles denial safely.
- Navigation does not expose counts for hidden data before backend authorization.

## Acceptance criteria

- [ ] Each seeded role sees the correct main navigation and actions.
- [ ] Viewer cannot see create/edit/upload/offboarding controls.
- [ ] Counsel does not see owner-transfer or offboarding controls.
- [ ] Manager/Admin see organization-wide operational pages according to matrix.
- [ ] Backend denial produces not-found/forbidden UI without revealing hidden record detail.
- [ ] Permission helpers are explicit pure functions, not a framework.

## Required tests

- Role navigation matrix.
- Direct route denial.
- Read-only action visibility.
- Backend `404` confidential record state.

## Related tasks

- FE-005
