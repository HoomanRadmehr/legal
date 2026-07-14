import { afterEach, expect, test, vi } from "vitest";

import { resetApiClientAuth } from "../../../api/client";
import { buildDeadlineListQuery, listDeadlines } from "../api";

afterEach(() => {
  resetApiClientAuth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("maps deadline list filters and view to the backend allowlist", () => {
  expect(
    buildDeadlineListQuery({
      assignee: "assignee-id",
      dueAfter: "2027-01-01T10:00:00.000Z",
      matter: "matter-id",
      ordering: "-due_at",
      page: 2,
      priority: "high",
      status: "open",
      view: "assigned_to_me",
    }),
  ).toEqual({
    assignee: "assignee-id",
    due_after: "2027-01-01T10:00:00.000Z",
    due_before: undefined,
    matter: "matter-id",
    ordering: "-due_at",
    page: 2,
    priority: "high",
    status: "open",
    view: "assigned_to_me",
  });
});

test("lists deadlines through the typed API function", async () => {
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

  await listDeadlines({ view: "today" });

  const call = fetchImpl.mock.calls[0];
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }
  const url = String(call[0]);
  expect(url).toContain("/api/v1/deadlines/");
  expect(url).toContain("view=today");
});
