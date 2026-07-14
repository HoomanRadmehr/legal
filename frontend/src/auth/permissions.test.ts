import { describe, expect, test } from "vitest";

import {
  ROLE_LEGAL_ADMIN,
  ROLE_LEGAL_COUNSEL,
  ROLE_LEGAL_MANAGER,
  ROLE_VIEWER,
  canArchiveMatter,
  canChangeMatterOwner,
  canConfigureAnotherUsersNotifications,
  canCreateMatter,
  canEditMatter,
  canEditOwnedMatter,
  canManageOrganization,
  canRunOffboarding,
  canUploadDocument,
  readonlyReason,
} from "./permissions";

describe("permission helpers", () => {
  test("matches the main mutation role matrix", () => {
    expect(canCreateMatter(ROLE_LEGAL_ADMIN)).toBe(true);
    expect(canCreateMatter(ROLE_LEGAL_MANAGER)).toBe(true);
    expect(canCreateMatter(ROLE_LEGAL_COUNSEL)).toBe(true);
    expect(canCreateMatter(ROLE_VIEWER)).toBe(false);

    expect(canEditMatter(ROLE_VIEWER)).toBe(false);
    expect(canUploadDocument(ROLE_VIEWER)).toBe(false);
  });

  test("keeps owner transfer and offboarding to elevated roles", () => {
    expect(canChangeMatterOwner(ROLE_LEGAL_ADMIN)).toBe(true);
    expect(canChangeMatterOwner(ROLE_LEGAL_MANAGER)).toBe(true);
    expect(canChangeMatterOwner(ROLE_LEGAL_COUNSEL)).toBe(false);
    expect(canRunOffboarding(ROLE_LEGAL_ADMIN)).toBe(true);
    expect(canRunOffboarding(ROLE_LEGAL_MANAGER)).toBe(false);
    expect(canRunOffboarding(ROLE_LEGAL_COUNSEL)).toBe(false);
  });

  test("keeps organization administration admin-only", () => {
    expect(canManageOrganization(ROLE_LEGAL_ADMIN)).toBe(true);
    expect(canManageOrganization(ROLE_LEGAL_MANAGER)).toBe(false);
    expect(canConfigureAnotherUsersNotifications(ROLE_LEGAL_ADMIN)).toBe(true);
    expect(canConfigureAnotherUsersNotifications(ROLE_LEGAL_MANAGER)).toBe(
      false,
    );
  });

  test("evaluates matter-level counsel access explicitly", () => {
    expect(canEditOwnedMatter(ROLE_LEGAL_COUNSEL, "view", true)).toBe(true);
    expect(canEditOwnedMatter(ROLE_LEGAL_COUNSEL, "edit", false)).toBe(true);
    expect(canEditOwnedMatter(ROLE_LEGAL_COUNSEL, "view", false)).toBe(false);
    expect(canEditOwnedMatter(ROLE_VIEWER, "edit", true)).toBe(false);
  });

  test("archives are owner-only for counsel", () => {
    expect(canArchiveMatter(ROLE_LEGAL_MANAGER, "view", false)).toBe(true);
    expect(canArchiveMatter(ROLE_LEGAL_COUNSEL, "edit", true)).toBe(true);
    expect(canArchiveMatter(ROLE_LEGAL_COUNSEL, "edit", false)).toBe(false);
  });

  test("provides a read-only reason for viewers only", () => {
    expect(readonlyReason(ROLE_VIEWER)).toBe("Viewer access is read-only.");
    expect(readonlyReason(ROLE_LEGAL_COUNSEL)).toBeNull();
  });
});
