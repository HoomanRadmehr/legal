import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { NoticeFilters } from "../components/NoticeFilters";
import { NoticeListTable } from "../components/NoticeListTable";
import { noticeText } from "../components/noticeLabels";
import { useNoticeList } from "../hooks";
import type {
  NoticeListParams,
  NoticeOrdering,
  NoticeResponseStatus,
  NoticeStatus,
} from "../types";
import { NoticePageShell } from "./NoticePageShell";

const DEFAULT_PAGE_SIZE = 20;

export function NoticeListPage() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locale } = useI18n();
  const labels = noticeText(locale);
  const params = noticeListParamsFromSearch(searchParams);
  const query = useNoticeList(params);
  const canCreate = canCreateMatter(session?.membership.role ?? "");

  return (
    <NoticePageShell>
      <PageHeader
        eyebrow={labels.eyebrow}
        title={labels.listTitle}
        description={labels.listDescription}
        actions={
          canCreate ? <Link to="/notices/new">{labels.create}</Link> : null
        }
      />
      <NoticeFilters
        params={params}
        onSubmit={(nextParams) => setSearchParams(paramsToSearch(nextParams))}
      />
      {query.isLoading ? <LoadingState label={labels.loadingList} /> : null}
      {query.isError ? (
        <ErrorState title={labels.unavailable} message={query.error.message} />
      ) : null}
      {query.data ? (
        <NoticeListTable
          page={params.page ?? 1}
          pageCount={pageCount(query.data.count)}
          rows={query.data.results}
        />
      ) : null}
    </NoticePageShell>
  );
}

function noticeListParamsFromSearch(
  searchParams: URLSearchParams,
): NoticeListParams {
  return {
    archived: archivedFromSearch(searchParams),
    ordering:
      (searchParams.get("ordering") as NoticeOrdering | null) ??
      "response_deadline",
    overdue: searchParams.get("overdue") === "true" ? true : undefined,
    page: Number(searchParams.get("page") ?? "1"),
    receivedAfter: searchParams.get("received_after") ?? undefined,
    receivedBefore: searchParams.get("received_before") ?? undefined,
    responseStatus: ((searchParams.get(
      "response_status",
    ) as NoticeResponseStatus | null) ?? "") as NoticeResponseStatus | "",
    search: searchParams.get("search") ?? undefined,
    sender: searchParams.get("sender") ?? undefined,
    status: ((searchParams.get("status") as NoticeStatus | null) ?? "") as
      NoticeStatus | "",
  };
}

function paramsToSearch(params: NoticeListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "archived", params.archived);
  appendParam(search, "ordering", params.ordering);
  appendParam(search, "overdue", params.overdue);
  appendParam(search, "received_after", params.receivedAfter);
  appendParam(search, "received_before", params.receivedBefore);
  appendParam(search, "response_status", params.responseStatus);
  appendParam(search, "search", params.search);
  appendParam(search, "sender", params.sender);
  appendParam(search, "status", params.status);
  return search;
}

function archivedFromSearch(
  searchParams: URLSearchParams,
): boolean | undefined {
  const archived = searchParams.get("archived");
  if (archived === "true") {
    return true;
  }
  if (archived === "all") {
    return undefined;
  }
  return false;
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

function pageCount(count: number): number {
  return Math.max(1, Math.ceil(count / DEFAULT_PAGE_SIZE));
}
