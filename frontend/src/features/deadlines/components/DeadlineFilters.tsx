import type { FormEvent } from "react";

import type {
  DeadlineListParams,
  DeadlineOrdering,
  DeadlinePriority,
  DeadlineStatus,
  DeadlineView,
} from "../types";
import { deadlinePriorityLabel, deadlineStatusLabel } from "./deadlineLabels";

const ORDERING_OPTIONS: { label: string; value: DeadlineOrdering }[] = [
  { label: "Due soonest", value: "due_at" },
  { label: "Due latest", value: "-due_at" },
  { label: "Priority", value: "priority" },
  { label: "Recently updated", value: "-updated_at" },
];

export function DeadlineFilters({
  onSubmit,
  params,
}: {
  onSubmit: (params: DeadlineListParams) => void;
  params: DeadlineListParams;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget), params.view));
  }

  return (
    <form
      aria-label="Deadline filters"
      className="deadline-filters"
      onSubmit={handleSubmit}
    >
      <label>
        Matter ID
        <input defaultValue={params.matter ?? ""} name="matter" />
      </label>
      <label>
        Assignee ID
        <input defaultValue={params.assignee ?? ""} name="assignee" />
      </label>
      <label>
        Status
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">Open deadlines</option>
          {(["open", "completed", "cancelled"] as const).map((status) => (
            <option key={status} value={status}>
              {deadlineStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select defaultValue={params.priority ?? ""} name="priority">
          <option value="">Any priority</option>
          {(["normal", "low", "high", "critical"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {deadlinePriorityLabel(priority)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Due after
        <input
          defaultValue={params.dueAfter ?? ""}
          name="dueAfter"
          type="datetime-local"
        />
      </label>
      <label>
        Due before
        <input
          defaultValue={params.dueBefore ?? ""}
          name="dueBefore"
          type="datetime-local"
        />
      </label>
      <label>
        Ordering
        <select defaultValue={params.ordering ?? "due_at"} name="ordering">
          {ORDERING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Apply filters</button>
    </form>
  );
}

function formDataToParams(
  formData: FormData,
  view: DeadlineView,
): DeadlineListParams {
  return {
    assignee: stringParam(formData, "assignee"),
    dueAfter: localDateTimeParam(formData, "dueAfter"),
    dueBefore: localDateTimeParam(formData, "dueBefore"),
    matter: stringParam(formData, "matter"),
    ordering: stringParam(formData, "ordering") as DeadlineOrdering,
    priority: stringParam(formData, "priority") as
      DeadlinePriority | "" | undefined,
    status: stringParam(formData, "status") as DeadlineStatus | "" | undefined,
    view,
  };
}

function stringParam(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function localDateTimeParam(
  formData: FormData,
  key: string,
): string | undefined {
  const value = stringParam(formData, key);
  return value ? new Date(value).toISOString() : undefined;
}
