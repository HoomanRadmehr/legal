import { afterEach, expect, test, vi } from "vitest";

import { resetApiClientAuth } from "../../../api/client";
import { buildNoticeListQuery, listNotices } from "../api";

afterEach(() => {
  resetApiClientAuth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("maps notice filters to the backend allowlist", () => {
  expect(
    buildNoticeListQuery({
      archived: false,
      ordering: "response_deadline",
      overdue: true,
      page: 2,
      receivedAfter: "2027-01-01",
      receivedBefore: "2027-01-31",
      responseStatus: "pending",
      search: "notice",
      sender: "Regulator",
      status: "response_due",
    }),
  ).toEqual({
    archived: false,
    ordering: "response_deadline",
    overdue: true,
    owner: undefined,
    page: 2,
    received_after: "2027-01-01",
    received_before: "2027-01-31",
    response_deadline_after: undefined,
    response_deadline_before: undefined,
    response_status: "pending",
    search: "notice",
    sender: "Regulator",
    status: "response_due",
  });
});

test("lists notices through the typed API function", async () => {
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

  await listNotices({ archived: false, search: "agency" });

  const call = fetchImpl.mock.calls[0];
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }
  const url = String(call[0]);
  expect(url).toContain("/api/v1/notices/");
  expect(url).toContain("archived=false");
  expect(url).toContain("search=agency");
});
