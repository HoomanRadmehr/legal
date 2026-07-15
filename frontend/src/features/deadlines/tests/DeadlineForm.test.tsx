import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import { I18nProvider } from "../../../i18n";
import { DeadlineForm } from "../components/DeadlineForm";
import type {
  DeadlineDetail,
  DeadlineInput,
  DeadlineUpdateInput,
} from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("validates required deadline fields before submit", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: DeadlineInput | DeadlineUpdateInput) =>
    deadlineDetail(input),
  );
  renderForm(<DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />);

  await user.click(screen.getByRole("button", { name: "Create deadline" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Title");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("submits ISO due timestamp and reminder flag", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: DeadlineInput | DeadlineUpdateInput) =>
    deadlineDetail(input),
  );
  vi.stubGlobal("fetch", vi.fn(fetchChoicePage));
  renderForm(<DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Title"), "File response");
  await selectChoice(user, "Matter", "Northern contract");
  await selectChoice(user, "Assignee", "Ava Counsel");
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
  vi.stubGlobal("fetch", vi.fn(fetchChoicePage));
  renderForm(<DeadlineForm mode="create" mutationError={null} onSubmit={onSubmit} />, "fa");

  await user.type(screen.getByLabelText("عنوان"), "مهلت پاسخ");
  await selectChoice(user, "رکورد", "Northern contract");
  await selectChoice(user, "مسئول", "Ava Counsel");
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

function renderForm(children: ReactNode, locale: "en" | "fa" = "en") {
  return render(
    <I18nProvider initialLocale={locale}>
      <QueryClientProvider client={createAppQueryClient()}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  );
}

async function selectChoice(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByText(option));
}

async function fetchChoicePage(input: RequestInfo | URL) {
  const path = requestPath(input);
  if (path === "/api/v1/matters/choices/") {
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
  if (path === "/api/v1/memberships/choices/") {
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

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
