import type { FormEvent } from "react";

import { useI18n } from "../../../i18n";
import type {
  DeadlineListParams,
  DeadlineOrdering,
  DeadlinePriority,
  DeadlineStatus,
  DeadlineView,
} from "../types";
import {
  deadlinePriorityLabel,
  deadlineStatusLabel,
  deadlineText,
} from "./deadlineLabels";

export function DeadlineFilters({
  onSubmit,
  params,
}: {
  onSubmit: (params: DeadlineListParams) => void;
  params: DeadlineListParams;
}) {
  const { locale } = useI18n();
  const labels = deadlineText(locale);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget), params.view));
  }

  return (
    <form
      aria-label={labels.filters}
      className="deadline-filters"
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
          <option value="">{labels.openOnly}</option>
          {(["open", "completed", "cancelled"] as const).map((status) => (
            <option key={status} value={status}>
              {deadlineStatusLabel(status, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.priority}
        <select defaultValue={params.priority ?? ""} name="priority">
          <option value="">{labels.options.anyPriority}</option>
          {(["normal", "low", "high", "critical"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {deadlinePriorityLabel(priority, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.dueAfter}
        <input
          defaultValue={params.dueAfter ?? ""}
          name="dueAfter"
          type="datetime-local"
        />
      </label>
      <label>
        {labels.dueBefore}
        <input
          defaultValue={params.dueBefore ?? ""}
          name="dueBefore"
          type="datetime-local"
        />
      </label>
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
  labels: ReturnType<typeof deadlineText>,
): { label: string; value: DeadlineOrdering }[] {
  return [
    { label: labels.options.dueSoonest, value: "due_at" },
    { label: labels.options.dueLatest, value: "-due_at" },
    { label: labels.options.priority, value: "priority" },
    { label: labels.options.recent, value: "-updated_at" },
  ];
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
