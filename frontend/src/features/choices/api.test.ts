import { afterEach, expect, test, vi } from "vitest";

import { resetApiClientAuth } from "../../api/client";
import { listMatterChoices, listMembershipChoices } from "./api";

afterEach(() => {
  resetApiClientAuth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("lists membership choices through the approved endpoint and maps IDs", async () => {
  const fetchImpl = vi.fn(async () =>
    Response.json({
      has_more: false,
      next_cursor: null,
      results: [
        {
          id: "membership-1",
          label: "Sara Ahmadi",
          role: "legal_counsel",
          secondary_label: "sara@example.test",
          user_id: "user-1",
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchImpl);

  const page = await listMembershipChoices({
    excludeMembershipId: "membership-2",
    purpose: "offboarding_replacement",
    query: " sara ",
  });

  expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
    "/api/v1/memberships/choices/",
  );
  expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
    "exclude_membership_id=membership-2",
  );
  expect(page.results[0]).toEqual({
    id: "membership-1",
    label: "Sara Ahmadi",
    role: "legal_counsel",
    secondaryLabel: "sara@example.test",
    userId: "user-1",
  });
});

test("lists matter choices through the matter choice endpoint", async () => {
  const fetchImpl = vi.fn(async () =>
    Response.json({
      has_more: false,
      next_cursor: null,
      results: [
        {
          id: "matter-1",
          kind: "case",
          label: "Case title",
          secondary_label: "CASE-1",
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchImpl);

  const page = await listMatterChoices({
    kind: "case",
    purpose: "deadline_create",
    query: "case",
  });

  expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
    "/api/v1/matters/choices/",
  );
  expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
    "purpose=deadline_create",
  );
  expect(page.results[0]).toEqual({
    id: "matter-1",
    kind: "case",
    label: "Case title",
    secondaryLabel: "CASE-1",
  });
});
