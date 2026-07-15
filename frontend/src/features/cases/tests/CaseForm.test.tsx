import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import { I18nProvider } from "../../../i18n";
import { CaseForm } from "../components/CaseForm";
import type { CaseDetail, CaseInput, CaseUpdateInput } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("validates create fields and submits party rows", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: CaseInput | CaseUpdateInput) =>
    caseDetail(input),
  );
  renderForm(<CaseForm mode="create" mutationError={null} onSubmit={onSubmit} />);

  await user.click(screen.getByRole("button", { name: "Create case" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Title");

  await user.type(screen.getByLabelText("Title"), "Employment dispute");
  await user.type(screen.getByLabelText("Reference code"), "CASE-2027-001");
  await user.click(screen.getByRole("button", { name: "Add party" }));
  await user.type(screen.getByLabelText("Party name"), "Client Ltd");
  await user.click(screen.getByRole("button", { name: "Create case" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      parties: [
        expect.objectContaining({ name: "Client Ltd", role: "client" }),
      ],
      reference_code: "CASE-2027-001",
      title: "Employment dispute",
    }),
  );
});

test("submits a case without optional party rows", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: CaseInput | CaseUpdateInput) =>
    caseDetail(input),
  );
  renderForm(<CaseForm mode="create" mutationError={null} onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Title"), "Employment dispute");
  await user.type(screen.getByLabelText("Reference code"), "CASE-2027-001");
  await user.click(screen.getByRole("button", { name: "Create case" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      parties: [],
      reference_code: "CASE-2027-001",
      title: "Employment dispute",
    }),
  );
});

test("submits selected owner as a membership id only", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: CaseInput | CaseUpdateInput) =>
    caseDetail(input),
  );
  vi.stubGlobal("fetch", vi.fn(fetchMembershipChoices));
  renderForm(<CaseForm mode="create" mutationError={null} onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Title"), "Employment dispute");
  await user.type(screen.getByLabelText("Reference code"), "CASE-2027-001");
  await user.click(screen.getByLabelText("Owner"));
  await user.click(await screen.findByText("Sara Ahmadi"));
  await user.click(screen.getByRole("button", { name: "Create case" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      owner_id: "membership-1",
      reference_code: "CASE-2027-001",
    }),
  );
  expect(onSubmit).not.toHaveBeenCalledWith(
    expect.objectContaining({ user_id: "user-1" }),
  );
}

test("Persian Jalali date input submits canonical Gregorian ISO date", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: CaseInput | CaseUpdateInput) =>
    caseDetail(input),
  );
  renderForm(<CaseForm mode="create" mutationError={null} onSubmit={onSubmit} />, "fa");

  await user.type(screen.getByLabelText("عنوان"), "پرونده نمونه");
  await user.type(screen.getByLabelText("کد مرجع"), "CASE-1406-001");
  await user.type(screen.getByLabelText("تاریخ باز شدن"), "1406-01-01");
  await user.click(screen.getByRole("button", { name: "افزودن طرف" }));
  await user.type(screen.getByLabelText("نام طرف"), "موکل");
  await user.click(screen.getByRole("button", { name: "ایجاد پرونده" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      opened_on: "2027-03-21",
      reference_code: "CASE-1406-001",
    }),
  );
});

function renderForm(children: ReactNode, locale: "en" | "fa" = "en") {
  return render(
    <I18nProvider initialLocale={locale}>
      <QueryClientProvider client={createAppQueryClient()}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  );
}

async function fetchMembershipChoices(input: RequestInfo | URL) {
  if (requestPath(input) === "/api/v1/memberships/choices/") {
    return Response.json({
      has_more: false,
      next_cursor: null,
      results: [
        {
          id: "membership-1",
          label: "Sara Ahmadi",
          role: "legal_counsel",
          secondary_label: "sara@example.test",
          user_id: "user-1",
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

function caseDetail(input: CaseInput | CaseUpdateInput): CaseDetail {
  return {
    ...input,
    archived_at: null,
    case_type: input.case_type ?? "litigation",
    closed_on: input.closed_on ?? null,
    court_or_authority: input.court_or_authority ?? "",
    created_at: "2027-01-01T10:00:00Z",
    description: input.description ?? "",
    filing_date: input.filing_date ?? null,
    id: "case-1",
    opened_on: input.opened_on ?? null,
    outcome_summary: input.outcome_summary ?? "",
    owner_id: "11111111-1111-4111-8111-111111111111",
    parties: [],
    priority: input.priority ?? "normal",
    reference_code: input.reference_code ?? "CASE-2027-001",
    status: input.status ?? "open",
    title: input.title ?? "Employment dispute",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}
