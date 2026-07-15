import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { DeadlineFilters } from "../components/DeadlineFilters";
import { DeadlineListTable } from "../components/DeadlineListTable";
import { DeadlineViewTabs } from "../components/DeadlineViewTabs";
import { deadlineText } from "../components/deadlineLabels";
import { DEADLINE_VIEWS } from "../deadlineViews";
import { useDeadlineList } from "../hooks";
import type {
  DeadlineListParams,
  DeadlineOrdering,
  DeadlinePriority,
  DeadlineStatus,
  DeadlineView,
} from "../types";
import { DeadlinePageShell } from "./DeadlinePageShell";

const DEFAULT_PAGE_SIZE = 20;

export function DeadlineListPage() {
  const { session } = useAuth();
  const { locale } = useI18n();
  const labels = deadlineText(locale);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = deadlineListParamsFromSearch(searchParams);
  const query = useDeadlineList(params);
  const canCreate = canCreateMatter(session?.membership.role ?? "");

  return (
    <DeadlinePageShell>
      <PageHeader
        eyebrow={labels.listTitle}
        title={labels.listTitle}
        description={labels.listDescription}
        actions={
          canCreate ? <Link to="/deadlines/new">{labels.create}</Link> : null
        }
      />
      <p className="deadline-timezone">{labels.timezone}</p>
      <DeadlineViewTabs
        activeView={params.view}
        onChange={(view) =>
          setSearchParams(paramsToSearch({ ...params, view }))
        }
      />
      <DeadlineFilters
        params={params}
        onSubmit={(nextParams) => setSearchParams(paramsToSearch(nextParams))}
      />
      {query.isLoading ? <LoadingState label={labels.loadingList} /> : null}
      {query.isError ? <DeadlineListError error={query.error} /> : null}
      {query.data ? (
        <DeadlineListTable
          page={params.page ?? 1}
          pageCount={pageCount(query.data.count)}
          rows={query.data.results}
        />
      ) : null}
    </DeadlinePageShell>
  );
}

function DeadlineListError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = deadlineText(locale);

  return (
    <ErrorState
      title={labels.error}
      message={deadlineErrorMessage(error, labels)}
    />
  );
}

function deadlineListParamsFromSearch(
  searchParams: URLSearchParams,
): DeadlineListParams {
  return {
    assignee: searchParams.get("assignee") ?? undefined,
    dueAfter: searchParams.get("due_after") ?? undefined,
    dueBefore: searchParams.get("due_before") ?? undefined,
    matter: searchParams.get("matter") ?? undefined,
    ordering:
      (searchParams.get("ordering") as DeadlineOrdering | null) ?? "due_at",
    page: Number(searchParams.get("page") ?? "1"),
    priority: ((searchParams.get("priority") as DeadlinePriority | null) ??
      "") as DeadlinePriority | "",
    status: ((searchParams.get("status") as DeadlineStatus | null) ?? "") as
      DeadlineStatus | "",
    view: viewFromSearch(searchParams),
  };
}

function paramsToSearch(params: DeadlineListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "assignee", params.assignee);
  appendParam(search, "due_after", params.dueAfter);
  appendParam(search, "due_before", params.dueBefore);
  appendParam(search, "matter", params.matter);
  appendParam(search, "ordering", params.ordering);
  appendParam(search, "priority", params.priority);
  appendParam(search, "status", params.status);
  appendParam(search, "view", params.view);
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

function viewFromSearch(searchParams: URLSearchParams): DeadlineView {
  const view = searchParams.get("view");
  if (DEADLINE_VIEWS.includes(view as DeadlineView)) {
    return view as DeadlineView;
  }
  return "today";
}

function pageCount(count: number): number {
  return Math.max(1, Math.ceil(count / DEFAULT_PAGE_SIZE));
}

function deadlineErrorMessage(
  error: Error,
  labels: ReturnType<typeof deadlineText>,
): string {
  if (
    "retryAfterSeconds" in error &&
    typeof error.retryAfterSeconds === "number"
  ) {
    const suffix = labels.retrySuffix.replace(
      "{{seconds}}",
      String(error.retryAfterSeconds),
    );
    return labels.rateLimited.replace("{{suffix}}", suffix);
  }
  return error.message;
}
