import type { FormEvent } from "react";

import { useI18n } from "../../../i18n";
import type { TaskListParams, TaskOrdering, TaskStatus } from "../types";
import { taskStatusLabel, taskText } from "./taskLabels";

export function TaskFilters({
  onSubmit,
  params,
}: {
  onSubmit: (params: TaskListParams) => void;
  params: TaskListParams;
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget), params.view));
  }

  return (
    <form
      aria-label={labels.filters}
      className="task-filters"
      onSubmit={handleSubmit}
    >
      <label>
        {labels.matter}
        <input defaultValue={params.matter ?? ""} name="matter" />
      </label>
      <label>
        {labels.assignee}
        <input defaultValue={params.assignee ?? ""} name="assignee" />
      </label>
      <label>
        {labels.status}
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">{labels.options.anyStatus}</option>
          {(["todo", "in_progress", "done", "cancelled"] as const).map(
            (status) => (
              <option key={status} value={status}>
                {taskStatusLabel(status, locale)}
              </option>
            ),
          )}
        </select>
      </label>
      <DateTimeFilter
        label={labels.dueAfter}
        name="dueAfter"
        value={params.dueAfter}
      />
      <DateTimeFilter
        label={labels.dueBefore}
        name="dueBefore"
        value={params.dueBefore}
      />
      <label>
        {labels.ordering}
        <select defaultValue={params.ordering ?? "due_at"} name="ordering">
          {orderingOptions(labels).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">{labels.applyFilters}</button>
    </form>
  );
}

function orderingOptions(
  labels: ReturnType<typeof taskText>,
): { label: string; value: TaskOrdering }[] {
  return [
    { label: labels.options.dueSoonest, value: "due_at" },
    { label: labels.options.recent, value: "-updated_at" },
    { label: labels.options.newest, value: "-created_at" },
    { label: labels.options.status, value: "status" },
  ];
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
