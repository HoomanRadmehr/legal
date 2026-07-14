import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

import { DeadlineForm } from "../components/DeadlineForm";
import type {
  DeadlineDetail,
  DeadlineInput,
  DeadlineUpdateInput,
} from "../types";

test("validates required deadline fields before submit", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: DeadlineInput | DeadlineUpdateInput) =>
    deadlineDetail(input),
  );
  render(
    <MemoryRouter>
      <DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Create deadline" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("title");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("submits ISO due timestamp and reminder flag", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: DeadlineInput | DeadlineUpdateInput) =>
    deadlineDetail(input),
  );
  render(
    <MemoryRouter>
      <DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />
    </MemoryRouter>,
  );

  await user.type(screen.getByLabelText("Title"), "File response");
  await user.type(screen.getByLabelText("Matter ID"), uuid("1"));
  await user.type(screen.getByLabelText("Assignee membership ID"), uuid("2"));
  await user.type(
    screen.getByLabelText("Due date and time"),
    "2027-07-15T12:30",
  );
  await user.click(screen.getByLabelText("Reminder enabled"));
  await user.click(screen.getByRole("button", { name: "Create deadline" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      due_at: expect.stringContaining("2027-07-15T"),
      reminder_enabled: false,
      title: "File response",
    }),
  );
});

function deadlineDetail(
  input: DeadlineInput | DeadlineUpdateInput,
): DeadlineDetail {
  return {
    assignee_id: input.assignee_id ?? uuid("2"),
    cancelled_at: null,
    cancelled_by_id: null,
    completed_at: null,
    completed_by_id: null,
    created_at: "2027-01-01T10:00:00Z",
    description: input.description ?? "",
    due_at: input.due_at ?? "2027-07-15T12:30:00Z",
    id: "deadline-1",
    matter_id: input.matter_id ?? uuid("1"),
    priority: input.priority ?? "normal",
    reminder_enabled: input.reminder_enabled ?? true,
    status: "open",
    title: input.title ?? "File response",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
