import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

import { ContractForm } from "../components/ContractForm";
import type {
  ContractDetail,
  ContractInput,
  ContractUpdateInput,
} from "../types";

test("validates local date order before submit", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: ContractInput | ContractUpdateInput) =>
    contractDetail(input),
  );
  render(
    <MemoryRouter>
      <ContractForm mode="create" mutationError={null} onSubmit={onSubmit} />
    </MemoryRouter>,
  );

  await fillRequiredFields(user);
  await user.type(screen.getByLabelText("Effective date"), "2027-07-01");
  await user.type(screen.getByLabelText("Expiration date"), "2027-06-01");
  await user.click(screen.getByRole("button", { name: "Create contract" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Expiration date cannot precede effective date.",
  );
  expect(onSubmit).not.toHaveBeenCalled();
});

test("maps backend contract date errors to visible fields", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async () => {
    throw Object.assign(
      new Error("Renewal date cannot be after expiration date."),
      {
        code: "contract_date_invalid",
        details: {},
        status: 422,
      },
    );
  });
  render(
    <MemoryRouter>
      <ContractForm mode="create" mutationError={null} onSubmit={onSubmit} />
    </MemoryRouter>,
  );

  await fillRequiredFields(user);
  await user.type(screen.getByLabelText("Effective date"), "2027-01-01");
  await user.type(screen.getByLabelText("Expiration date"), "2027-12-31");
  await user.type(screen.getByLabelText("Renewal date"), "2027-11-30");
  await user.click(screen.getByRole("button", { name: "Create contract" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("renewal date");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Renewal date cannot be after expiration date.",
  );
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "Vendor agreement");
  await user.type(screen.getByLabelText("Reference code"), "CON-2027-001");
  await user.type(screen.getByLabelText("Counterparty"), "Northwind");
}

function contractDetail(
  input: ContractInput | ContractUpdateInput,
): ContractDetail {
  return {
    ...input,
    archived_at: null,
    closed_on: input.closed_on ?? null,
    contract_type: input.contract_type ?? "vendor",
    counterparty: input.counterparty ?? "Northwind",
    created_at: "2027-01-01T10:00:00Z",
    description: input.description ?? "",
    effective_date: input.effective_date ?? "2027-01-01",
    expiration_date: input.expiration_date ?? null,
    id: "contract-1",
    key_terms: input.key_terms ?? {},
    opened_on: input.opened_on ?? null,
    owner_id: "11111111-1111-4111-8111-111111111111",
    priority: input.priority ?? "normal",
    reference_code: input.reference_code ?? "CON-2027-001",
    renewal_date: input.renewal_date ?? null,
    status: input.status ?? "active",
    title: input.title ?? "Vendor agreement",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}
