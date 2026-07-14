import type { FormEvent } from "react";

import type { TaskListParams, TaskOrdering, TaskStatus } from "../types";
import { taskStatusLabel } from "./taskLabels";

const ORDERING_OPTIONS: { label: string; value: TaskOrdering }[] = [
  { label: "Due soonest", value: "due_at" },
  { label: "Recently updated", value: "-updated_at" },
  { label: "Newest created", value: "-created_at" },
  { label: "Status", value: "status" },
];

export function TaskFilters({
  onSubmit,
  params,
}: {
  onSubmit: (params: TaskListParams) => void;
  params: TaskListParams;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget), params.view));
  }

  return (
    <form
      aria-label="Task filters"
      className="task-filters"
      onSubmit={handleSubmit}
    >
      <label>
        Matter ID
        <input defaultValue={params.matter ?? ""} name="matter" />
      </label>
      <label>
        Assignee membership ID
        <input defaultValue={params.assignee ?? ""} name="assignee" />
      </label>
      <label>
        Status
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">Any status</option>
          {(["todo", "in_progress", "done", "cancelled"] as const).map(
            (status) => (
              <option key={status} value={status}>
                {taskStatusLabel(status)}
              </option>
            ),
          )}
        </select>
      </label>
      <DateTimeFilter
        label="Due after"
        name="dueAfter"
        value={params.dueAfter}
      />
      <DateTimeFilter
        label="Due before"
        name="dueBefore"
        value={params.dueBefore}
      />
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

function DateTimeFilter({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label>
      {label}
      <input defaultValue={value ?? ""} name={name} type="datetime-local" />
    </label>
  );
}

function formDataToParams(
  formData: FormData,
  view: TaskListParams["view"],
): TaskListParams {
  return {
    assignee: stringParam(formData, "assignee"),
    dueAfter: localDateTimeParam(formData, "dueAfter"),
    dueBefore: localDateTimeParam(formData, "dueBefore"),
    matter: stringParam(formData, "matter"),
    ordering: stringParam(formData, "ordering") as TaskOrdering,
    status: stringParam(formData, "status") as TaskStatus | "" | undefined,
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
