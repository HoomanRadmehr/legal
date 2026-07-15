import { Link, useSearchParams } from "react-router-dom";

import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useAuth } from "../../../auth";
import { useI18n } from "../../../i18n";
import { CaseFilters } from "../components/CaseFilters";
import { CaseListTable } from "../components/CaseListTable";
import { caseText } from "../components/caseLabels";
import { useCaseList } from "../hooks";
import type {
  CaseListParams,
  CaseOrdering,
  CasePriority,
  CaseStatus,
  CaseType,
} from "../types";
import { CasePageShell } from "./CasePageShell";

const DEFAULT_PAGE_SIZE = 20;

export function CaseListPage() {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = caseText(locale);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = caseListParamsFromSearch(searchParams);
  const query = useCaseList(params);
  const canCreate = canCreateMatter(session?.membership.role ?? "");

  return (
    <CasePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.listTitle}
        description={labels.listDescription}
        actions={canCreate ? <Link to="/cases/new">{labels.create}</Link> : null}
      />
      <CaseFilters
        params={params}
        onSubmit={(nextParams) => setSearchParams(paramsToSearch(nextParams))}
      />
      {query.isLoading ? <LoadingState label={labels.loadingList} /> : null}
      {query.isError ? (
        <ErrorState title={labels.error} message={query.error.message} />
      ) : null}
      {query.data ? (
        <CaseListTable
          page={params.page ?? 1}
          pageCount={pageCount(query.data.count)}
          rows={query.data.results}
        />
      ) : null}
    </CasePageShell>
  );
}

function caseListParamsFromSearch(
  searchParams: URLSearchParams,
): CaseListParams {
  return {
    archived: archivedFromSearch(searchParams),
    caseType: ((searchParams.get("case_type") as CaseType | null) ?? "") as
      CaseType | "",
    createdAfter: searchParams.get("created_after") ?? undefined,
    createdBefore: searchParams.get("created_before") ?? undefined,
    openedAfter: searchParams.get("opened_after") ?? undefined,
    openedBefore: searchParams.get("opened_before") ?? undefined,
    ordering:
      (searchParams.get("ordering") as CaseOrdering | null) ?? "reference_code",
    owner: searchParams.get("owner") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    priority: ((searchParams.get("priority") as CasePriority | null) ?? "") as
      CasePriority | "",
    search: searchParams.get("search") ?? undefined,
    status: ((searchParams.get("status") as CaseStatus | null) ?? "") as
      CaseStatus | "",
  };
}

function paramsToSearch(params: CaseListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "archived", params.archived);
  appendParam(search, "case_type", params.caseType);
  appendParam(search, "created_after", params.createdAfter);
  appendParam(search, "created_before", params.createdBefore);
  appendParam(search, "opened_after", params.openedAfter);
  appendParam(search, "opened_before", params.openedBefore);
  appendParam(search, "ordering", params.ordering);
  appendParam(search, "owner", params.owner);
  appendParam(search, "priority", params.priority);
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
