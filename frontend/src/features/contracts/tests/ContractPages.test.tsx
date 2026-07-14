import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { ContractDetailPage } from "../pages/ContractDetailPage";
import { ContractEditPage } from "../pages/ContractEditPage";
import { ContractListPage } from "../pages/ContractListPage";
import { renderContractRoute, resetContractTestState } from "./testUtils";

afterEach(resetContractTestState);

test("renders list filters and accessible renewal state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(contractListResponse())),
  );

  renderContractRoute({
    children: <ContractListPage />,
    route:
      "/contracts?status=active&contract_type=vendor&counterparty=Northwind",
  });

  expect(
    await screen.findByRole("table", { name: "Contracts" }),
  ).toBeInTheDocument();
  expect(screen.getByText("CON-2027-001")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Active")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Vendor")).toBeInTheDocument();
  expect(screen.getByText("Renewal date within 30 days")).toBeInTheDocument();
});

test("viewer detail is read-only and timeline uses safe labels", async () => {
  vi.stubGlobal("fetch", vi.fn(fetchContractDetailAndTimeline));

  renderContractRoute({
    children: <ContractDetailPage />,
    path: "/contracts/:contractId",
    role: "viewer",
    route: "/contracts/contract-1",
  });

  expect(
    await screen.findByRole("heading", { name: "Vendor agreement" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Edit contract" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Archive contract" }),
  ).not.toBeInTheDocument();
  expect(await screen.findByText("Contract created")).toBeInTheDocument();
  expect(screen.queryByText("contract.created")).not.toBeInTheDocument();
});

test("archive requires confirmation and does not present delete wording", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchContractDetailAndTimeline);
  vi.stubGlobal("fetch", fetchImpl);

  renderContractRoute({
    children: <ContractDetailPage />,
    path: "/contracts/:contractId",
    route: "/contracts/contract-1",
  });

  await user.click(
    await screen.findByRole("button", { name: "Archive contract" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Archive contract" });
  expect(dialog).toHaveTextContent("not a delete");
  await user.click(
    within(dialog).getByRole("button", { name: "Archive contract" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/contracts/contract-1/archive/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

test("version conflict is shown without clearing edited input", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchContractConflictFlow));

  renderContractRoute({
    children: <ContractEditPage />,
    path: "/contracts/:contractId/edit",
    route: "/contracts/contract-1/edit",
  });

  const title = await screen.findByLabelText("Title");
  await user.clear(title);
  await user.type(title, "Updated contract");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText(/changed while you were editing/i),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("Updated contract")).toBeInTheDocument();
});

async function fetchContractDetailAndTimeline(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/contracts/contract-1/") {
    return Response.json(contractDetail());
  }
  if (path === "/api/v1/contracts/contract-1/timeline/") {
    return Response.json([
      {
        action: "contract.created",
        actor_membership_id: "member-1",
        after_values: {},
        before_values: {},
        created_at: "2027-01-01T10:00:00Z",
        id: "event-1",
        metadata: {},
        target_id: "contract-1",
        target_type: "matter",
      },
    ]);
  }
  if (
    path === "/api/v1/contracts/contract-1/archive/" &&
    init?.method === "POST"
  ) {
    return Response.json({
      ...contractDetail(),
      archived_at: "2027-01-02T10:00:00Z",
      status: "archived",
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchContractConflictFlow(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/contracts/contract-1/" && init?.method !== "PATCH") {
    return Response.json(contractDetail());
  }
  if (path === "/api/v1/contracts/contract-1/" && init?.method === "PATCH") {
    return Response.json(
      {
        code: "contract_version_conflict",
        details: {},
        message: "Contract version conflict.",
      },
      { status: 409 },
    );
  }
  return Response.json([], { status: 200 });
}

function contractListResponse() {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [{ ...contractListItem(), renewal_date: dateOffsetFromToday(10) }],
  };
}

function contractListItem() {
  return {
    archived_at: null,
    contract_type: "vendor",
    counterparty: "Northwind",
    created_at: "2027-01-01T10:00:00Z",
    effective_date: "2027-01-01",
    expiration_date: "2027-12-31",
    id: "contract-1",
    owner_id: "11111111-1111-4111-8111-111111111111",
    priority: "normal",
    reference_code: "CON-2027-001",
    renewal_date: "2027-06-30",
    status: "active",
    title: "Vendor agreement",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function contractDetail() {
  return {
    ...contractListItem(),
    closed_on: null,
    description: "Contract description",
    key_terms: { payment: "net 30" },
    opened_on: "2027-01-01",
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}

function dateOffsetFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
