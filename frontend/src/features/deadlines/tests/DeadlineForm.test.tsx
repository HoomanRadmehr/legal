import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

import { I18nProvider } from "../../../i18n";
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
    <I18nProvider initialLocale="en">
      <MemoryRouter>
        <DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />
      </MemoryRouter>
    </I18nProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Create deadline" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Title");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("submits ISO due timestamp and reminder flag", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: DeadlineInput | DeadlineUpdateInput) =>
    deadlineDetail(input),
  );
  render(
    <I18nProvider initialLocale="en">
      <MemoryRouter>
        <DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />
      </MemoryRouter>
    </I18nProvider>,
  );

  await user.type(screen.getByLabelText("Title"), "File response");
  await user.type(screen.getByLabelText("Matter"), uuid("1"));
  await user.type(screen.getByLabelText("Assignee membership ID"), uuid("2"));
  await user.type(
    screen.getByLabelText("Due date and time"),
    "2027-07-15T12:30",
  );
  await user.click(screen.getByLabelText("Reminder"));
  await user.click(screen.getByRole("button", { name: "Create deadline" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      due_at: expect.stringContaining("2027-07-15T"),
      reminder_enabled: false,
      title: "File response",
    }),
  );
});

test("Persian Jalali datetime input submits ISO timestamp", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: DeadlineInput | DeadlineUpdateInput) =>
    deadlineDetail(input),
  );
  render(
    <I18nProvider initialLocale="fa">
      <MemoryRouter>
        <DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />
      </MemoryRouter>
    </I18nProvider>,
  );

  await user.type(screen.getByLabelText("عنوان"), "مهلت پاسخ");
  await user.type(screen.getByLabelText("رکورد"), uuid("1"));
  await user.type(screen.getByLabelText("شناسه عضویت مسئول"), uuid("2"));
  await user.type(
    screen.getByLabelText("تاریخ و زمان سررسید"),
    "1406-01-01 09:30",
  );
  await user.click(screen.getByRole("button", { name: "ایجاد مهلت" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      due_at: expect.stringContaining("2027-03-21T"),
      title: "مهلت پاسخ",
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
