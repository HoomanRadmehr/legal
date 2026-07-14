import { afterEach, expect, test, vi } from "vitest";

import { resetApiClientAuth } from "../../../api/client";
import { buildTaskListQuery, listTasks } from "../api";

afterEach(() => {
  resetApiClientAuth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("maps task filters and assigned view to the backend allowlist", () => {
  expect(
    buildTaskListQuery({
      assignee: uuid("2"),
      dueAfter: "2027-07-15T10:00:00.000Z",
      dueBefore: "2027-07-16T10:00:00.000Z",
      matter: uuid("1"),
      ordering: "-updated_at",
      page: 2,
      status: "in_progress",
      view: "assigned_to_me",
    }),
  ).toEqual({
    assignee: uuid("2"),
    due_after: "2027-07-15T10:00:00.000Z",
    due_before: "2027-07-16T10:00:00.000Z",
    matter: uuid("1"),
    ordering: "-updated_at",
    page: 2,
    status: "in_progress",
    view: "assigned_to_me",
  });
});

test("lists tasks through the typed API function", async () => {
  const fetchImpl = vi.fn<typeof fetch>(async () =>
    Response.json({ count: 0, next: null, previous: null, results: [] }),
  );
  vi.stubGlobal("fetch", fetchImpl);

  await listTasks({ status: "todo", view: "assigned_to_me" });

  const call = fetchImpl.mock.calls[0];
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }
  const url = String(call[0]);
  expect(url).toContain("/api/v1/tasks/");
  expect(url).toContain("status=todo");
  expect(url).toContain("view=assigned_to_me");
});

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
