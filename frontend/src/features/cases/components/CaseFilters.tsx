import type { FormEvent } from "react";

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
  caseTypeLabel,
} from "./caseLabels";

type CaseFiltersProps = {
  onSubmit: (params: CaseListParams) => void;
  params: CaseListParams;
};

const ORDERING_OPTIONS: { label: string; value: CaseOrdering }[] = [
  { label: "Reference A-Z", value: "reference_code" },
  { label: "Newest created", value: "-created_at" },
  { label: "Recently updated", value: "-updated_at" },
  { label: "Priority", value: "priority" },
];

export function CaseFilters({ onSubmit, params }: CaseFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget)));
  }

  return (
    <form
      className="case-filters"
      aria-label="Case filters"
      onSubmit={handleSubmit}
    >
      <label>
        Search
        <input defaultValue={params.search ?? ""} name="search" type="search" />
      </label>
      <label>
        Status
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">Any status</option>
          {(["open", "pending", "on_hold", "closed", "archived"] as const).map(
            (status) => (
              <option key={status} value={status}>
                {caseStatusLabel(status)}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        Priority
        <select defaultValue={params.priority ?? ""} name="priority">
          <option value="">Any priority</option>
          {(["normal", "low", "high", "critical"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {casePriorityLabel(priority)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Case type
        <select defaultValue={params.caseType ?? ""} name="caseType">
          <option value="">Any type</option>
          {(["litigation", "regulatory", "internal", "other"] as const).map(
            (caseType) => (
              <option key={caseType} value={caseType}>
                {caseTypeLabel(caseType)}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        Owner ID
        <input defaultValue={params.owner ?? ""} name="owner" />
      </label>
      <label>
        Opened after
        <input
          defaultValue={params.openedAfter ?? ""}
          name="openedAfter"
          type="date"
        />
      </label>
      <label>
        Opened before
        <input
          defaultValue={params.openedBefore ?? ""}
          name="openedBefore"
          type="date"
        />
      </label>
      <label>
        Archive state
        <select defaultValue={archiveValue(params.archived)} name="archived">
          <option value="">Active only</option>
          <option value="true">Archived only</option>
          <option value="all">All cases</option>
        </select>
      </label>
      <label>
        Ordering
        <select
          defaultValue={params.ordering ?? "reference_code"}
          name="ordering"
        >
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
