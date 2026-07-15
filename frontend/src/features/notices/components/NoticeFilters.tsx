import type { FormEvent } from "react";

import type {
  NoticeListParams,
  NoticeOrdering,
  NoticeResponseStatus,
  NoticeStatus,
} from "../types";
import { useI18n } from "../../../i18n";
import {
  noticeResponseStatusLabel,
  noticeStatusLabel,
  noticeText,
} from "./noticeLabels";

export function NoticeFilters({
  onSubmit,
  params,
}: {
  onSubmit: (params: NoticeListParams) => void;
  params: NoticeListParams;
}) {
  const { locale } = useI18n();
  const labels = noticeText(locale);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget)));
  }

  return (
    <form
      aria-label={labels.filters}
      className="notice-filters"
      onSubmit={handleSubmit}
    >
      <label>
        {labels.search}
        <input defaultValue={params.search ?? ""} name="search" type="search" />
      </label>
      <label>
        {labels.sender}
        <input defaultValue={params.sender ?? ""} name="sender" />
      </label>
      <label>
        {labels.status}
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">{labels.anyStatus}</option>
          {(
            [
              "received",
              "under_review",
              "response_due",
              "responded",
              "closed",
              "archived",
            ] as const
          ).map((status) => (
            <option key={status} value={status}>
              {noticeStatusLabel(status, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.responseStatus}
        <select
          defaultValue={params.responseStatus ?? ""}
          name="responseStatus"
        >
          <option value="">{labels.anyResponse}</option>
          {(["pending", "responded", "cancelled"] as const).map((status) => (
            <option key={status} value={status}>
              {noticeResponseStatusLabel(status, locale)}
            </option>
          ))}
        </select>
      </label>
      <DateFilter
        label={labels.receivedAfter}
        name="receivedAfter"
        value={params.receivedAfter}
      />
      <DateFilter
        label={labels.receivedBefore}
        name="receivedBefore"
        value={params.receivedBefore}
      />
      <label>
        {labels.archiveState}
        <select defaultValue={archiveValue(params.archived)} name="archived">
          <option value="">{labels.activeOnly}</option>
          <option value="true">{labels.archivedOnly}</option>
          <option value="all">{labels.allNotices}</option>
        </select>
      </label>
      <label>
        {labels.overdueResponse}
        <select defaultValue={overdueValue(params.overdue)} name="overdue">
          <option value="">{labels.any}</option>
          <option value="true">{labels.overdueOnly}</option>
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
  labels: ReturnType<typeof noticeText>,
): { label: string; value: NoticeOrdering }[] {
  return [
    { label: labels.options.reference, value: "reference_code" },
    { label: labels.options.responseDueSoonest, value: "response_deadline" },
    { label: labels.options.newestReceived, value: "-received_date" },
    { label: labels.options.recentlyUpdated, value: "-updated_at" },
  ];
}

function DateFilter({
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

function formDataToParams(formData: FormData): NoticeListParams {
  return {
    archived: archivedParam(String(formData.get("archived") ?? "")),
    ordering: stringParam(formData, "ordering") as NoticeOrdering,
    overdue: overdueParam(String(formData.get("overdue") ?? "")),
    receivedAfter: stringParam(formData, "receivedAfter"),
    receivedBefore: stringParam(formData, "receivedBefore"),
    responseStatus: stringParam(formData, "responseStatus") as
      NoticeResponseStatus | "" | undefined,
    search: stringParam(formData, "search"),
    sender: stringParam(formData, "sender"),
    status: stringParam(formData, "status") as NoticeStatus | "" | undefined,
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

function overdueParam(value: string): boolean | undefined {
  return value === "true" ? true : undefined;
}

function overdueValue(value: boolean | undefined): string {
  return value === true ? "true" : "";
}
