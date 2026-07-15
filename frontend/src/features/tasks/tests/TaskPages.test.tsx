import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { MatterTaskSection } from "../components/MatterTaskSection";
import { TaskDetailPage } from "../pages/TaskDetailPage";
import { TaskEditPage } from "../pages/TaskEditPage";
import { TaskListPage } from "../pages/TaskListPage";
import { renderTaskRoute, resetTaskTestState } from "./testUtils";

afterEach(resetTaskTestState);

test("counsel and viewer default to assigned-to-me list view", async () => {
  const fetchImpl = vi.fn(async () => Response.json(taskListResponse()));
  vi.stubGlobal("fetch", fetchImpl);

  renderTaskRoute({
    children: <TaskListPage />,
    role: "legal_counsel",
  });

  expect(
    await screen.findByRole("table", { name: "Tasks" }),
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(requestViews(fetchImpl)).toContain("assigned_to_me");
  });
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
        { headers: { "Retry-After": "12" }, status: 429 },
      ),
    ),
  );

  renderTaskRoute({ children: <TaskListPage /> });

  expect((await screen.findAllByText(/12 seconds/i)).length).toBeGreaterThan(0);
});

test("viewer detail is read-only", async () => {
  vi.stubGlobal("fetch", vi.fn(fetchTaskDetailAndActions));

  renderTaskRoute({
    children: <TaskDetailPage />,
    path: "/tasks/:taskId",
    role: "viewer",
    route: "/tasks/task-1",
  });

  expect(
    await screen.findByRole("heading", { name: "Review filing" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Edit task" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Complete task" }),
  ).not.toBeInTheDocument();
});

test("complete and cancel actions use confirmations", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchTaskDetailAndActions);
  vi.stubGlobal("fetch", fetchImpl);

  renderTaskRoute({
    children: <TaskDetailPage />,
    path: "/tasks/:taskId",
    route: "/tasks/task-1",
  });

  await user.click(
    await screen.findByRole("button", { name: "Complete task" }),
  );
  const completeDialog = screen.getByRole("dialog", { name: "Complete task" });
  await user.click(
    within(completeDialog).getByRole("button", { name: "Complete task" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/tasks/task-1/complete/"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  await user.click(await screen.findByRole("button", { name: "Cancel task" }));
  const cancelDialog = screen.getByRole("dialog", { name: "Cancel task" });
  await user.click(
    within(cancelDialog).getByRole("button", { name: "Cancel task" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/tasks/task-1/cancel/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

test("counsel edit hides reassignment and shows version conflict", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchTaskConflictAndMemberships));

  renderTaskRoute({
    children: <TaskEditPage />,
    path: "/tasks/:taskId/edit",
    role: "legal_counsel",
    route: "/tasks/task-1/edit",
  });

  const title = await screen.findByLabelText("Title");
  expect(screen.queryByLabelText("Active assignee")).not.toBeInTheDocument();
  await user.clear(title);
  await user.type(title, "Updated task title");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText(/changed while you were working/i),
  ).toBeInTheDocument();
});

test("matter task section filters by matter and exposes permitted actions", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchMatterTasksAndActions);
  vi.stubGlobal("fetch", fetchImpl);

  renderTaskRoute({
    children: <MatterTaskSection canMutate matterId={uuid("1")} />,
    path: "/",
    route: "/",
  });

  expect(
    await screen.findByRole("table", { name: "Matter tasks" }),
  ).toBeInTheDocument();
  expect(requestMatters(fetchImpl)).toContain(uuid("1"));
  await user.click(screen.getByRole("button", { name: "Complete task" }));
  await user.click(
    within(screen.getByRole("dialog", { name: "Complete task" })).getByRole(
      "button",
      {
        name: "Complete task",
      },
    ),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/tasks/task-1/complete/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

async function fetchTaskDetailAndActions(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/tasks/task-1/") {
    return Response.json(taskDetail());
  }
  if (path === "/api/v1/tasks/task-1/complete/" && init?.method === "POST") {
    return Response.json({
      ...taskDetail(),
      completed_at: "2027-07-15T12:35:00Z",
      status: "done",
    });
  }
  if (path === "/api/v1/tasks/task-1/cancel/" && init?.method === "POST") {
    return Response.json({
      ...taskDetail(),
      cancelled_at: "2027-07-15T12:40:00Z",
      status: "cancelled",
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchTaskConflictAndMemberships(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/tasks/task-1/" && init?.method !== "PATCH") {
    return Response.json(taskDetail());
  }
  if (path === "/api/v1/tasks/task-1/" && init?.method === "PATCH") {
    return Response.json(
      {
        code: "task_version_conflict",
        details: {},
        message: "Task version conflict.",
      },
      { status: 409 },
    );
  }
  if (path === "/api/v1/memberships/") {
    return Response.json({ count: 0, next: null, previous: null, results: [] });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchMatterTasksAndActions(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/tasks/") {
    return Response.json(taskListResponse());
  }
  if (path === "/api/v1/tasks/task-1/complete/" && init?.method === "POST") {
    return Response.json({ ...taskDetail(), status: "done" });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

function taskListResponse() {
  return { count: 1, next: null, previous: null, results: [taskListItem()] };
}

function taskListItem() {
  return {
    assignee_id: uuid("2"),
    cancelled_at: null,
    cancelled_by_id: null,
    completed_at: null,
    completed_by_id: null,
    created_at: "2027-01-01T10:00:00Z",
    due_at: "2027-07-15T12:30:00Z",
    id: "task-1",
    matter_id: uuid("1"),
    status: "todo",
    title: "Review filing",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function taskDetail() {
  return {
    ...taskListItem(),
    description: "Check the filing before submission.",
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

function requestMatters(fetchImpl: ReturnType<typeof vi.fn>): string[] {
  return fetchImpl.mock.calls.map((call) => {
    const url = new URL(String(call[0]));
    return url.searchParams.get("matter") ?? "";
  });
}

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
