import type { FormEvent } from "react";

import type {
  ContractListParams,
  ContractOrdering,
  ContractPriority,
  ContractStatus,
  ContractType,
} from "../types";
import {
  contractPriorityLabel,
  contractStatusLabel,
  contractTypeLabel,
} from "./contractLabels";

type ContractFiltersProps = {
  onSubmit: (params: ContractListParams) => void;
  params: ContractListParams;
};

const ORDERING_OPTIONS: { label: string; value: ContractOrdering }[] = [
  { label: "Reference A-Z", value: "reference_code" },
  { label: "Newest created", value: "-created_at" },
  { label: "Effective soonest", value: "effective_date" },
  { label: "Expiration soonest", value: "expiration_date" },
  { label: "Renewal soonest", value: "renewal_date" },
];

export function ContractFilters({ onSubmit, params }: ContractFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget)));
  }

  return (
    <form
      className="contract-filters"
      aria-label="Contract filters"
      onSubmit={handleSubmit}
    >
      <label>
        Search
        <input defaultValue={params.search ?? ""} name="search" type="search" />
      </label>
      <label>
        Counterparty
        <input defaultValue={params.counterparty ?? ""} name="counterparty" />
      </label>
      <ContractSelects params={params} />
      <ContractDateFilters params={params} />
      <label>
        Archive state
        <select defaultValue={archiveValue(params.archived)} name="archived">
          <option value="">Active only</option>
          <option value="true">Archived only</option>
          <option value="all">All contracts</option>
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

function ContractSelects({ params }: { params: ContractListParams }) {
  return (
    <>
      <label>
        Status
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">Any status</option>
          {(
            ["active", "draft", "expired", "terminated", "archived"] as const
          ).map((status) => (
            <option key={status} value={status}>
              {contractStatusLabel(status)}
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
              {contractPriorityLabel(priority)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Contract type
        <select defaultValue={params.contractType ?? ""} name="contractType">
          <option value="">Any type</option>
          {(["vendor", "service", "employment", "nda", "other"] as const).map(
            (contractType) => (
              <option key={contractType} value={contractType}>
                {contractTypeLabel(contractType)}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        Owner ID
        <input defaultValue={params.owner ?? ""} name="owner" />
      </label>
    </>
  );
}

function ContractDateFilters({ params }: { params: ContractListParams }) {
  return (
    <>
      <DateInput
        label="Effective after"
        name="effectiveAfter"
        value={params.effectiveAfter}
      />
      <DateInput
        label="Effective before"
        name="effectiveBefore"
        value={params.effectiveBefore}
      />
      <DateInput
        label="Expiration after"
        name="expirationAfter"
        value={params.expirationAfter}
      />
      <DateInput
        label="Expiration before"
        name="expirationBefore"
        value={params.expirationBefore}
      />
      <DateInput
        label="Renewal after"
        name="renewalAfter"
        value={params.renewalAfter}
      />
      <DateInput
        label="Renewal before"
        name="renewalBefore"
        value={params.renewalBefore}
      />
    </>
  );
}

function DateInput({
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
      <input defaultValue={value ?? ""} name={name} type="date" />
    </label>
  );
}

function formDataToParams(formData: FormData): ContractListParams {
  return {
    archived: archivedParam(String(formData.get("archived") ?? "")),
    contractType: stringParam(formData, "contractType") as
      ContractType | "" | undefined,
    counterparty: stringParam(formData, "counterparty"),
    effectiveAfter: stringParam(formData, "effectiveAfter"),
    effectiveBefore: stringParam(formData, "effectiveBefore"),
    expirationAfter: stringParam(formData, "expirationAfter"),
    expirationBefore: stringParam(formData, "expirationBefore"),
    ordering: stringParam(formData, "ordering") as ContractOrdering,
    owner: stringParam(formData, "owner"),
    priority: stringParam(formData, "priority") as
      ContractPriority | "" | undefined,
    renewalAfter: stringParam(formData, "renewalAfter"),
    renewalBefore: stringParam(formData, "renewalBefore"),
    search: stringParam(formData, "search"),
    status: stringParam(formData, "status") as ContractStatus | "" | undefined,
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
