import { Link, useSearchParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { canCreateMatter } from "../../../auth/permissions";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { TaskFilters } from "../components/TaskFilters";
import { TaskListTable } from "../components/TaskListTable";
import { useTaskList } from "../hooks";
import type {
  TaskListParams,
  TaskOrdering,
  TaskStatus,
  TaskView,
} from "../types";
import { TaskPageShell } from "./TaskPageShell";

const DEFAULT_PAGE_SIZE = 20;

export function TaskListPage() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = session?.membership.role ?? "";
  const params = taskListParamsFromSearch(searchParams, role);
  const query = useTaskList(params);
  const canCreate = canCreateMatter(role);

  return (
    <TaskPageShell>
      <PageHeader
        eyebrow="Tasks"
        title="Tasks"
        description="Review matter work, assignment, due dates, and final states."
        actions={canCreate ? <Link to="/tasks/new">Create task</Link> : null}
      />
      {params.view === "assigned_to_me" ? (
        <p className="task-alert">Showing tasks assigned to me.</p>
      ) : null}
      <TaskFilters
        params={params}
        onSubmit={(nextParams) => setSearchParams(paramsToSearch(nextParams))}
      />
      {query.isLoading ? <LoadingState label="Loading tasks" /> : null}
      {query.isError ? <TaskListError error={query.error} /> : null}
      {query.data ? (
        <TaskListTable
          page={params.page ?? 1}
          pageCount={pageCount(query.data.count)}
          rows={query.data.results}
        />
      ) : null}
    </TaskPageShell>
  );
}

function TaskListError({ error }: { error: Error }) {
  return (
    <ErrorState
      title="Tasks unavailable"
      message={taskErrorMessage(error)}
      retryAfterSeconds={
        isApiError(error) ? error.retryAfterSeconds : undefined
      }
    />
  );
}

function taskListParamsFromSearch(
  searchParams: URLSearchParams,
  role: string,
): TaskListParams {
  return {
    assignee: searchParams.get("assignee") ?? undefined,
    dueAfter: searchParams.get("due_after") ?? undefined,
    dueBefore: searchParams.get("due_before") ?? undefined,
    matter: searchParams.get("matter") ?? undefined,
    ordering: (searchParams.get("ordering") as TaskOrdering | null) ?? "due_at",
    page: Number(searchParams.get("page") ?? "1"),
    status: ((searchParams.get("status") as TaskStatus | null) ?? "") as
      TaskStatus | "",
    view: viewFromSearch(searchParams, role),
  };
}

function paramsToSearch(params: TaskListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "assignee", params.assignee);
  appendParam(search, "due_after", params.dueAfter);
  appendParam(search, "due_before", params.dueBefore);
  appendParam(search, "matter", params.matter);
  appendParam(search, "ordering", params.ordering);
  appendParam(search, "page", params.page);
  appendParam(search, "status", params.status);
  appendParam(search, "view", params.view);
  return search;
}

function viewFromSearch(
  searchParams: URLSearchParams,
  role: string,
): TaskView | undefined {
  if (searchParams.get("view") === "assigned_to_me") {
    return "assigned_to_me";
  }
  if (role === "legal_counsel" || role === "viewer") {
    return "assigned_to_me";
  }
  return undefined;
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

function taskErrorMessage(error: Error): string {
  if (
    "retryAfterSeconds" in error &&
    typeof error.retryAfterSeconds === "number"
  ) {
    return `${error.message} Try again in ${error.retryAfterSeconds} seconds.`;
  }
  return error.message;
}
