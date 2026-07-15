import type { FormEvent } from "react";

import { useI18n } from "../../../i18n";
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
  contractText,
  contractTypeLabel,
} from "./contractLabels";

type ContractFiltersProps = {
  onSubmit: (params: ContractListParams) => void;
  params: ContractListParams;
};

export function ContractFilters({ onSubmit, params }: ContractFiltersProps) {
  const { locale } = useI18n();
  const labels = contractText(locale);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget)));
  }

  return (
    <form
      className="contract-filters"
      aria-label={labels.filters}
      onSubmit={handleSubmit}
    >
      <label>
        {labels.search}
        <input defaultValue={params.search ?? ""} name="search" type="search" />
      </label>
      <label>
        {labels.counterparty}
        <input defaultValue={params.counterparty ?? ""} name="counterparty" />
      </label>
      <ContractSelects labels={labels} locale={locale} params={params} />
      <ContractDateFilters labels={labels} params={params} />
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

function ContractSelects({
  labels,
  locale,
  params,
}: {
  labels: ReturnType<typeof contractText>;
  locale: ReturnType<typeof useI18n>["locale"];
  params: ContractListParams;
}) {
  return (
    <>
      <label>
        {labels.status}
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">{labels.options.anyStatus}</option>
          {(
            ["active", "draft", "expired", "terminated", "archived"] as const
          ).map((status) => (
            <option key={status} value={status}>
              {contractStatusLabel(status, locale)}
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
              {contractPriorityLabel(priority, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.contractType}
        <select defaultValue={params.contractType ?? ""} name="contractType">
          <option value="">{labels.options.anyType}</option>
          {(["vendor", "service", "employment", "nda", "other"] as const).map(
            (contractType) => (
              <option key={contractType} value={contractType}>
                {contractTypeLabel(contractType, locale)}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        {labels.ownerId}
        <input defaultValue={params.owner ?? ""} name="owner" />
      </label>
    </>
  );
}

function ContractDateFilters({
  labels,
  params,
}: {
  labels: ReturnType<typeof contractText>;
  params: ContractListParams;
}) {
  return (
    <>
      <DateInput
        label={labels.effectiveAfter}
        name="effectiveAfter"
        value={params.effectiveAfter}
      />
      <DateInput
        label={labels.effectiveBefore}
        name="effectiveBefore"
        value={params.effectiveBefore}
      />
      <DateInput
        label={labels.expirationAfter}
        name="expirationAfter"
        value={params.expirationAfter}
      />
      <DateInput
        label={labels.expirationBefore}
        name="expirationBefore"
        value={params.expirationBefore}
      />
      <DateInput
        label={labels.renewalAfter}
        name="renewalAfter"
        value={params.renewalAfter}
      />
      <DateInput
        label={labels.renewalBefore}
        name="renewalBefore"
        value={params.renewalBefore}
      />
    </>
  );
}

function orderingOptions(
  labels: ReturnType<typeof contractText>,
): { label: string; value: ContractOrdering }[] {
  return [
    { label: labels.options.reference, value: "reference_code" },
    { label: labels.options.newest, value: "-created_at" },
    { label: labels.options.effective, value: "effective_date" },
    { label: labels.options.expiration, value: "expiration_date" },
    { label: labels.options.renewal, value: "renewal_date" },
  ];
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
