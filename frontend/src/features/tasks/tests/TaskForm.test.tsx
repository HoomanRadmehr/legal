import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { TaskForm } from "../components/TaskForm";
import type { TaskDetail, TaskInput, TaskUpdateInput } from "../types";
import { renderTaskRoute, resetTaskTestState } from "./testUtils";

afterEach(resetTaskTestState);

test("requires active assignee choices for create", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: TaskInput | TaskUpdateInput) =>
    taskDetail(input),
  );
  vi.stubGlobal("fetch", vi.fn(fetchMembershipChoices));

  renderTaskRoute({
    children: (
      <TaskForm
        assignmentMode="editable"
        mode="create"
        mutationError={null}
        onSubmit={onSubmit}
      />
    ),
    path: "/",
    route: "/",
  });

  await user.type(screen.getByLabelText("Title"), "Review filing");
  await selectChoice(user, "Matter", "Northern contract");
  await selectChoice(user, "Assignee", "Ava Counsel");
  await user.type(
    screen.getByLabelText("Due date and time"),
    "2027-07-15T12:30",
  );
  await user.click(screen.getByRole("button", { name: "Create task" }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        assignee_id: uuid("2"),
        due_at: expect.stringContaining("2027-07-15T"),
        matter_id: uuid("1"),
        title: "Review filing",
      }),
    );
  });
});

test("locked assignment edit omits reassignment from update payload", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: TaskInput | TaskUpdateInput) =>
    taskDetail(input),
  );
  vi.stubGlobal("fetch", vi.fn(fetchMembershipChoices));

  renderTaskRoute({
    children: (
      <TaskForm
        assignmentMode="locked"
        initialTask={taskDetail({})}
        mode="edit"
        mutationError={null}
        onSubmit={onSubmit}
      />
    ),
    path: "/",
    route: "/",
  });

  expect(screen.queryByLabelText("Active assignee")).not.toBeInTheDocument();
  expect(screen.getByText(/reassignment is restricted/i)).toBeInTheDocument();
  await user.clear(screen.getByLabelText("Title"));
  await user.type(screen.getByLabelText("Title"), "Updated task title");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ assignee_id: expect.any(String) }),
    );
  });
});

async function fetchMembershipChoices(input: RequestInfo | URL) {
  if (requestPath(input) === "/api/v1/matters/choices/") {
    return Response.json({
      has_more: false,
      next_cursor: null,
      results: [
        {
          id: uuid("1"),
          kind: "case",
          label: "Northern contract",
          secondary_label: "CASE-1",
        },
      ],
    });
  }
  if (requestPath(input) === "/api/v1/memberships/choices/") {
    return Response.json({
      has_more: false,
      next_cursor: null,
      results: [
        {
          id: uuid("2"),
          label: "Ava Counsel",
          role: "legal_counsel",
          secondary_label: "ava@example.test",
          user_id: uuid("3"),
        },
      ],
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function selectChoice(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByText(option));
}

function taskDetail(input: Partial<TaskUpdateInput>): TaskDetail {
  return {
    assignee_id: input.assignee_id ?? uuid("2"),
    cancelled_at: null,
    cancelled_by_id: null,
    completed_at: null,
    completed_by_id: null,
    created_at: "2027-01-01T10:00:00Z",
    description: input.description ?? "",
    due_at: input.due_at ?? "2027-07-15T12:30:00Z",
    id: "task-1",
    matter_id: input.matter_id ?? uuid("1"),
    status: input.status ?? "todo",
    title: input.title ?? "Review filing",
    updated_at: "2027-01-01T10:00:00Z",
    version: input.version ?? 1,
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
