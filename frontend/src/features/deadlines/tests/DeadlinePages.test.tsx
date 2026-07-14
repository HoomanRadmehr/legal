import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { DeadlineDetailPage } from "../pages/DeadlineDetailPage";
import { DeadlineEditPage } from "../pages/DeadlineEditPage";
import { DeadlineListPage } from "../pages/DeadlineListPage";
import { renderDeadlineRoute, resetDeadlineTestState } from "./testUtils";

afterEach(resetDeadlineTestState);

test("tabs send the four explicit deadline view parameters", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async () => Response.json(deadlineListResponse()));
  vi.stubGlobal("fetch", fetchImpl);

  renderDeadlineRoute({ children: <DeadlineListPage /> });

  expect(
    await screen.findByRole("table", { name: "Deadlines" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Overdue" }));
  await user.click(screen.getByRole("tab", { name: "Upcoming" }));
  await user.click(screen.getByRole("tab", { name: "Assigned to me" }));

  await waitFor(() => {
    expect(requestViews(fetchImpl)).toEqual(
      expect.arrayContaining([
        "today",
        "overdue",
        "upcoming",
        "assigned_to_me",
      ]),
    );
  });
});

test("renders timezone label and does not hide returned matter id", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(deadlineListResponse())),
  );

  renderDeadlineRoute({
    children: <DeadlineListPage />,
    route: `/deadlines?view=assigned_to_me&matter=${uuid("1")}`,
  });

  expect(
    await screen.findByText("Organization timezone: server classified"),
  ).toBeInTheDocument();
  expect(await screen.findByText("File response")).toBeInTheDocument();
  expect(screen.getByText(uuid("1"))).toBeInTheDocument();
});

test("viewer detail is read-only", async () => {
  vi.stubGlobal("fetch", vi.fn(fetchDeadlineDetailAndActions));

  renderDeadlineRoute({
    children: <DeadlineDetailPage />,
    path: "/deadlines/:deadlineId",
    role: "viewer",
    route: "/deadlines/deadline-1",
  });

  expect(
    await screen.findByRole("heading", { name: "File response" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Edit deadline" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Complete deadline" }),
  ).not.toBeInTheDocument();
});

test("complete action uses confirmation", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchDeadlineDetailAndActions);
  vi.stubGlobal("fetch", fetchImpl);

  renderDeadlineRoute({
    children: <DeadlineDetailPage />,
    path: "/deadlines/:deadlineId",
    route: "/deadlines/deadline-1",
  });

  await user.click(
    await screen.findByRole("button", { name: "Complete deadline" }),
  );
  const completeDialog = screen.getByRole("dialog", {
    name: "Complete deadline",
  });
  await user.click(
    within(completeDialog).getByRole("button", { name: "Complete deadline" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/deadlines/deadline-1/complete/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

test("cancel action uses confirmation", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchDeadlineDetailAndActions);
  vi.stubGlobal("fetch", fetchImpl);

  renderDeadlineRoute({
    children: <DeadlineDetailPage />,
    path: "/deadlines/:deadlineId",
    route: "/deadlines/deadline-1",
  });

  await user.click(
    await screen.findByRole("button", { name: "Cancel deadline" }),
  );
  const cancelDialog = screen.getByRole("dialog", { name: "Cancel deadline" });
  expect(cancelDialog).toHaveTextContent("without deleting");
  await user.click(
    within(cancelDialog).getByRole("button", { name: "Cancel deadline" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/deadlines/deadline-1/cancel/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

test("shows version conflict and rate-limit messages", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchDeadlineConflictAndRateLimit));

  renderDeadlineRoute({
    children: <DeadlineEditPage />,
    path: "/deadlines/:deadlineId/edit",
    route: "/deadlines/deadline-1/edit",
  });

  const title = await screen.findByLabelText("Title");
  await user.clear(title);
  await user.type(title, "Updated response deadline");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText(/changed while you were working/i),
  ).toBeInTheDocument();
});

test("shows retry guidance for 429 list errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "rate_limit_exceeded",
          details: {},
          message: "Too many requests. Try again later.",
        },
        { headers: { "Retry-After": "15" }, status: 429 },
      ),
    ),
  );

  renderDeadlineRoute({ children: <DeadlineListPage /> });

  expect(await screen.findByText(/15 seconds/i)).toBeInTheDocument();
});

async function fetchDeadlineDetailAndActions(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/deadlines/deadline-1/") {
    return Response.json(deadlineDetail());
  }
  if (
    path === "/api/v1/deadlines/deadline-1/complete/" &&
    init?.method === "POST"
  ) {
    return Response.json({
      ...deadlineDetail(),
      completed_at: "2027-07-15T12:35:00Z",
      status: "completed",
      version: 2,
    });
  }
  if (
    path === "/api/v1/deadlines/deadline-1/cancel/" &&
    init?.method === "POST"
  ) {
    return Response.json({
      ...deadlineDetail(),
      cancelled_at: "2027-07-15T12:35:00Z",
      status: "cancelled",
      version: 2,
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchDeadlineConflictAndRateLimit(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/deadlines/deadline-1/" && init?.method !== "PATCH") {
    return Response.json(deadlineDetail());
  }
  if (path === "/api/v1/deadlines/deadline-1/" && init?.method === "PATCH") {
    return Response.json(
      {
        code: "deadline_version_conflict",
        details: {},
        message: "Deadline version conflict.",
      },
      { status: 409 },
    );
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

function deadlineListResponse() {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [deadlineListItem()],
  };
}

function deadlineListItem() {
  return {
    assignee_id: uuid("2"),
    cancelled_at: null,
    cancelled_by_id: null,
    completed_at: null,
    completed_by_id: null,
    created_at: "2027-01-01T10:00:00Z",
    due_at: "2027-07-15T12:30:00Z",
    id: "deadline-1",
    matter_id: uuid("1"),
    priority: "normal",
    reminder_enabled: true,
    status: "open",
    title: "File response",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function deadlineDetail() {
  return {
    ...deadlineListItem(),
    description: "Prepare and file response.",
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}

function requestViews(fetchImpl: ReturnType<typeof vi.fn>): string[] {
  return fetchImpl.mock.calls.map((call) => {
    const url = new URL(String(call[0]));
    return url.searchParams.get("view") ?? "";
  });
}

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
