import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

import { CaseForm } from "../components/CaseForm";
import type { CaseDetail, CaseInput, CaseUpdateInput } from "../types";

test("validates create fields and submits party rows", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: CaseInput | CaseUpdateInput) =>
    caseDetail(input),
  );
  render(
    <MemoryRouter>
      <CaseForm mode="create" mutationError={null} onSubmit={onSubmit} />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Create case" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("title");

  await user.type(screen.getByLabelText("Title"), "Employment dispute");
  await user.type(screen.getByLabelText("Reference code"), "CASE-2027-001");
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
