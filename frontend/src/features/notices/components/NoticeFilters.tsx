import type { FormEvent } from "react";

import type {
  NoticeListParams,
  NoticeOrdering,
  NoticeResponseStatus,
  NoticeStatus,
} from "../types";
import { noticeResponseStatusLabel, noticeStatusLabel } from "./noticeLabels";

const ORDERING_OPTIONS: { label: string; value: NoticeOrdering }[] = [
  { label: "Reference A-Z", value: "reference_code" },
  { label: "Response due soonest", value: "response_deadline" },
  { label: "Newest received", value: "-received_date" },
  { label: "Recently updated", value: "-updated_at" },
];

export function NoticeFilters({
  onSubmit,
  params,
}: {
  onSubmit: (params: NoticeListParams) => void;
  params: NoticeListParams;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(formDataToParams(new FormData(event.currentTarget)));
  }

  return (
    <form
      aria-label="Notice filters"
      className="notice-filters"
      onSubmit={handleSubmit}
    >
      <label>
        Search
        <input defaultValue={params.search ?? ""} name="search" type="search" />
      </label>
      <label>
        Sender
        <input defaultValue={params.sender ?? ""} name="sender" />
      </label>
      <label>
        Status
        <select defaultValue={params.status ?? ""} name="status">
          <option value="">Any status</option>
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
              {noticeStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Response status
        <select
          defaultValue={params.responseStatus ?? ""}
          name="responseStatus"
        >
          <option value="">Any response</option>
          {(["pending", "responded", "cancelled"] as const).map((status) => (
            <option key={status} value={status}>
              {noticeResponseStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <DateFilter
        label="Received after"
        name="receivedAfter"
        value={params.receivedAfter}
      />
      <DateFilter
        label="Received before"
        name="receivedBefore"
        value={params.receivedBefore}
      />
      <label>
        Archive state
        <select defaultValue={archiveValue(params.archived)} name="archived">
          <option value="">Active only</option>
          <option value="true">Archived only</option>
          <option value="all">All notices</option>
        </select>
      </label>
      <label>
        Overdue response
        <select defaultValue={overdueValue(params.overdue)} name="overdue">
          <option value="">Any</option>
          <option value="true">Overdue only</option>
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
