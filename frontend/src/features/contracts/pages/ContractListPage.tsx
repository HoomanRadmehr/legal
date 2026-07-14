import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { ContractFilters } from "../components/ContractFilters";
import { ContractListTable } from "../components/ContractListTable";
import { useContractList } from "../hooks";
import type {
  ContractListParams,
  ContractOrdering,
  ContractPriority,
  ContractStatus,
  ContractType,
} from "../types";
import { ContractPageShell } from "./ContractPageShell";

const DEFAULT_PAGE_SIZE = 20;

export function ContractListPage() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = contractListParamsFromSearch(searchParams);
  const query = useContractList(params);
  const canCreate = canCreateMatter(session?.membership.role ?? "");

  return (
    <ContractPageShell>
      <PageHeader
        eyebrow="Contracts"
        title="Contracts"
        description="Review contract status, counterparties, renewal dates, and expiration risk."
        actions={
          canCreate ? <Link to="/contracts/new">Create contract</Link> : null
        }
      />
      <ContractFilters
        params={params}
        onSubmit={(nextParams) => setSearchParams(paramsToSearch(nextParams))}
      />
      {query.isLoading ? <LoadingState label="Loading contracts" /> : null}
      {query.isError ? (
        <ErrorState
          title="Contracts unavailable"
          message={query.error.message}
        />
      ) : null}
      {query.data ? (
        <ContractListTable
          page={params.page ?? 1}
          pageCount={pageCount(query.data.count)}
          rows={query.data.results}
        />
      ) : null}
    </ContractPageShell>
  );
}

function contractListParamsFromSearch(
  searchParams: URLSearchParams,
): ContractListParams {
  return {
    archived: archivedFromSearch(searchParams),
    contractType: ((searchParams.get("contract_type") as ContractType | null) ??
      "") as ContractType | "",
    counterparty: searchParams.get("counterparty") ?? undefined,
    effectiveAfter: searchParams.get("effective_after") ?? undefined,
    effectiveBefore: searchParams.get("effective_before") ?? undefined,
    expirationAfter: searchParams.get("expiration_after") ?? undefined,
    expirationBefore: searchParams.get("expiration_before") ?? undefined,
    ordering:
      (searchParams.get("ordering") as ContractOrdering | null) ??
      "reference_code",
    owner: searchParams.get("owner") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    priority: ((searchParams.get("priority") as ContractPriority | null) ??
      "") as ContractPriority | "",
    renewalAfter: searchParams.get("renewal_after") ?? undefined,
    renewalBefore: searchParams.get("renewal_before") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: ((searchParams.get("status") as ContractStatus | null) ?? "") as
      ContractStatus | "",
  };
}

function paramsToSearch(params: ContractListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "archived", params.archived);
  appendParam(search, "contract_type", params.contractType);
  appendParam(search, "counterparty", params.counterparty);
  appendParam(search, "effective_after", params.effectiveAfter);
  appendParam(search, "effective_before", params.effectiveBefore);
  appendParam(search, "expiration_after", params.expirationAfter);
  appendParam(search, "expiration_before", params.expirationBefore);
  appendParam(search, "ordering", params.ordering);
  appendParam(search, "owner", params.owner);
  appendParam(search, "priority", params.priority);
  appendParam(search, "renewal_after", params.renewalAfter);
  appendParam(search, "renewal_before", params.renewalBefore);
  appendParam(search, "search", params.search);
  appendParam(search, "status", params.status);
  return search;
}

function appendParam(
  search: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value !== undefined && value !== "") {
    search.set(key, String(value));
  }
}

function archivedFromSearch(
  searchParams: URLSearchParams,
): boolean | undefined {
  const value = searchParams.get("archived");
  if (value === "true") {
    return true;
  }
  if (value === "false" || value === null) {
    return false;
  }
  return undefined;
}

function pageCount(count: number): number {
  return Math.max(1, Math.ceil(count / DEFAULT_PAGE_SIZE));
}
