export const ROLE_LEGAL_ADMIN = "legal_admin";
export const ROLE_LEGAL_MANAGER = "legal_manager";
export const ROLE_LEGAL_COUNSEL = "legal_counsel";
export const ROLE_VIEWER = "viewer";

export type MembershipRole =
  | typeof ROLE_LEGAL_ADMIN
  | typeof ROLE_LEGAL_MANAGER
  | typeof ROLE_LEGAL_COUNSEL
  | typeof ROLE_VIEWER;

export type MatterAccessLevel = "edit" | "view" | null | undefined;

export function isMembershipRole(role: string): role is MembershipRole {
  return (
    role === ROLE_LEGAL_ADMIN ||
    role === ROLE_LEGAL_MANAGER ||
    role === ROLE_LEGAL_COUNSEL ||
    role === ROLE_VIEWER
  );
}

export function canViewOrganizationDashboard(role: string): boolean {
  return isMembershipRole(role);
}

export function canCreateMatter(role: string): boolean {
  return (
    role === ROLE_LEGAL_ADMIN ||
    role === ROLE_LEGAL_MANAGER ||
    role === ROLE_LEGAL_COUNSEL
  );
}

export function canEditMatter(role: string): boolean {
  return canCreateMatter(role);
}

export function canUploadDocument(role: string): boolean {
  return canCreateMatter(role);
}

export function canChangeMatterOwner(role: string): boolean {
  return role === ROLE_LEGAL_ADMIN || role === ROLE_LEGAL_MANAGER;
}

export function canRunOffboarding(role: string): boolean {
  return role === ROLE_LEGAL_ADMIN;
}

export function canManageOrganization(role: string): boolean {
  return role === ROLE_LEGAL_ADMIN;
}

export function canViewActivityLog(role: string): boolean {
  return isMembershipRole(role);
}

export function canConfigureOwnNotifications(role: string): boolean {
  return isMembershipRole(role);
}

export function canConfigureAnotherUsersNotifications(role: string): boolean {
  return role === ROLE_LEGAL_ADMIN;
}

export function canEditOwnedMatter(
  role: string,
  accessLevel: MatterAccessLevel,
  isOwner: boolean,
): boolean {
  if (role === ROLE_LEGAL_ADMIN || role === ROLE_LEGAL_MANAGER) {
    return true;
  }
  if (role !== ROLE_LEGAL_COUNSEL) {
    return false;
  }

  return isOwner || accessLevel === "edit";
}

export function canArchiveMatter(
  role: string,
  accessLevel: MatterAccessLevel,
  isOwner: boolean,
): boolean {
  if (role === ROLE_LEGAL_ADMIN || role === ROLE_LEGAL_MANAGER) {
    return true;
  }

  return role === ROLE_LEGAL_COUNSEL && isOwner && accessLevel === "edit";
}

export function readonlyReason(role: string): string | null {
  if (role === ROLE_VIEWER) {
    return "Viewer access is read-only.";
  }

  return null;
}
