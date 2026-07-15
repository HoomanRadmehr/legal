import type { FormEvent } from "react";

import { useI18n } from "../../../i18n";
import type {
  CaseListParams,
  CaseOrdering,
  CasePriority,
  CaseStatus,
  CaseType,
} from "../types";
import {
  casePriorityLabel,
  caseStatusLabel,
  caseText,
  caseTypeLabel,
} from "./caseLabels";

type CaseFiltersProps = {
  onSubmit: (params: CaseListParams) => void;
  params: CaseListParams;
};

export function CaseFilters({ onSubmit, params }: CaseFiltersProps) {
  const { locale } = useI18n();
  const labels = caseText(locale);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget)));
  }

  return (
    <form
      className="case-filters"
      aria-label={labels.filters}
      onSubmit={handleSubmit}
    >
      <label>
        {labels.search}
        <input defaultValue={params.search ?? ""} name="search" type="search" />
      </label>
      <label>
        {labels.status}
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">{labels.options.anyStatus}</option>
          {(["open", "pending", "on_hold", "closed", "archived"] as const).map(
            (status) => (
              <option key={status} value={status}>
                {caseStatusLabel(status, locale)}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        {labels.priority}
        <select defaultValue={params.priority ?? ""} name="priority">
          <option value="">{labels.options.anyPriority}</option>
          {(["normal", "low", "high", "critical"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {casePriorityLabel(priority, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.caseType}
        <select defaultValue={params.caseType ?? ""} name="caseType">
          <option value="">{labels.options.anyType}</option>
          {(["litigation", "regulatory", "internal", "other"] as const).map(
            (caseType) => (
              <option key={caseType} value={caseType}>
                {caseTypeLabel(caseType, locale)}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        {labels.ownerId}
        <input defaultValue={params.owner ?? ""} name="owner" />
      </label>
      <label>
        {labels.openedAfter}
        <input
          defaultValue={params.openedAfter ?? ""}
          name="openedAfter"
          type="date"
        />
      </label>
      <label>
        {labels.openedBefore}
        <input
          defaultValue={params.openedBefore ?? ""}
          name="openedBefore"
          type="date"
        />
      </label>
      <label>
        {labels.archiveState}
        <select defaultValue={archiveValue(params.archived)} name="archived">
          <option value="">{labels.activeOnly}</option>
          <option value="true">{labels.archiveOnly}</option>
          <option value="all">{labels.archiveAll}</option>
        </select>
      </label>
      <label>
        {labels.ordering}
        <select
          defaultValue={params.ordering ?? "reference_code"}
          name="ordering"
        >
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
  labels: ReturnType<typeof caseText>,
): { label: string; value: CaseOrdering }[] {
  return [
    { label: labels.options.reference, value: "reference_code" },
    { label: labels.options.newest, value: "-created_at" },
    { label: labels.options.recent, value: "-updated_at" },
    { label: labels.options.priority, value: "priority" },
  ];
}

function formDataToParams(formData: FormData): CaseListParams {
  return {
    archived: archivedParam(String(formData.get("archived") ?? "")),
    caseType: stringParam(formData, "caseType") as CaseType | "" | undefined,
    openedAfter: stringParam(formData, "openedAfter"),
    openedBefore: stringParam(formData, "openedBefore"),
    ordering: stringParam(formData, "ordering") as CaseOrdering,
    owner: stringParam(formData, "owner"),
    priority: stringParam(formData, "priority") as
      CasePriority | "" | undefined,
    search: stringParam(formData, "search"),
    status: stringParam(formData, "status") as CaseStatus | "" | undefined,
  };
}

function stringParam(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function archivedParam(value: string): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "all") {
    return undefined;
  }
  return false;
}

function archiveValue(value: boolean | undefined): string {
  if (value === true) {
    return "true";
  }
  if (value === undefined) {
    return "all";
  }
  return "";
}
