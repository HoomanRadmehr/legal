import { afterEach, expect, test, vi } from "vitest";

import { resetApiClientAuth } from "../../../api/client";
import { buildContractListQuery, listContracts } from "../api";

afterEach(() => {
  resetApiClientAuth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("maps contract list filters to the backend allowlist", () => {
  expect(
    buildContractListQuery({
      archived: false,
      contractType: "vendor",
      counterparty: "Northwind",
      effectiveAfter: "2027-01-01",
      expirationBefore: "2027-12-31",
      ordering: "renewal_date",
      owner: "owner-id",
      page: 2,
      priority: "high",
      renewalAfter: "2027-06-01",
      search: "CON-1",
      status: "active",
    }),
  ).toEqual({
    archived: false,
    contract_type: "vendor",
    counterparty: "Northwind",
    effective_after: "2027-01-01",
    effective_before: undefined,
    expiration_after: undefined,
    expiration_before: "2027-12-31",
    ordering: "renewal_date",
    owner: "owner-id",
    page: 2,
    priority: "high",
    renewal_after: "2027-06-01",
    renewal_before: undefined,
    search: "CON-1",
    status: "active",
  });
});

test("lists contracts through the typed API function", async () => {
  const fetchImpl = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Response.json({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });
    },
  );
  vi.stubGlobal("fetch", fetchImpl);

  await listContracts({ archived: false, counterparty: "northwind" });

  const call = fetchImpl.mock.calls[0];
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }
  const url = String(call[0]);
  expect(url).toContain("/api/v1/contracts/");
  expect(url).toContain("archived=false");
  expect(url).toContain("counterparty=northwind");
});
