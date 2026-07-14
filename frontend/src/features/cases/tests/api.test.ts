import { afterEach, expect, test, vi } from "vitest";

import { resetApiClientAuth } from "../../../api/client";
import { buildCaseListQuery, listCases } from "../api";

afterEach(() => {
  resetApiClientAuth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("maps case list filters to the backend allowlist", () => {
  expect(
    buildCaseListQuery({
      archived: false,
      caseType: "litigation",
      openedAfter: "2027-01-01",
      ordering: "-updated_at",
      owner: "owner-id",
      page: 2,
      priority: "high",
      search: "CASE-1",
      status: "open",
    }),
  ).toEqual({
    archived: false,
    case_type: "litigation",
    created_after: undefined,
    created_before: undefined,
    opened_after: "2027-01-01",
    opened_before: undefined,
    ordering: "-updated_at",
    owner: "owner-id",
    page: 2,
    priority: "high",
    search: "CASE-1",
    status: "open",
  });
});

test("lists cases through the typed API function", async () => {
  const fetchImpl = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Response.json({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });
    },
  );
  vi.stubGlobal("fetch", fetchImpl);

  await listCases({ archived: false, search: "employment" });

  const call = fetchImpl.mock.calls[0];
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }
  const url = String(call[0]);
  expect(url).toContain("/api/v1/cases/");
  expect(url).toContain("archived=false");
  expect(url).toContain("search=employment");
});
