import type { FormEvent } from "react";

import type { ActivityListParams } from "../types";

const ACTION_OPTIONS = [
  "case.created",
  "case.updated",
  "contract.created",
  "contract.updated",
  "notice.created",
  "notice.updated",
  "deadline.created",
  "deadline.completed",
  "task.created",
  "task.completed",
  "matter.archived",
] as const;

export function ActivityFilters({
  labels,
  onSubmit,
  params,
}: {
  labels: {
    action: string;
    actor: string;
    allActions: string;
    apply: string;
    createdAfter: string;
    createdBefore: string;
    filters: string;
    matter: string;
    targetType: string;
  };
  onSubmit: (params: ActivityListParams) => void;
  params: ActivityListParams;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(paramsFromForm(event.currentTarget));
  }

  return (
    <form className="activity-filters" onSubmit={submit}>
      <fieldset>
        <legend>{labels.filters}</legend>
        <label>
          {labels.action}
          <select defaultValue={params.action ?? ""} name="action">
            <option value="">{labels.allActions}</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>
        <label>
          {labels.actor}
          <input defaultValue={params.actor ?? ""} name="actor" type="text" />
        </label>
        <label>
          {labels.matter}
          <input defaultValue={params.matter ?? ""} name="matter" type="text" />
        </label>
        <label>
          {labels.targetType}
          <input
            defaultValue={params.targetType ?? ""}
            name="target_type"
            type="text"
          />
        </label>
        <label>
          {labels.createdAfter}
          <input
            defaultValue={params.createdAfter ?? ""}
            name="created_after"
            type="text"
          />
        </label>
        <label>
          {labels.createdBefore}
          <input
            defaultValue={params.createdBefore ?? ""}
            name="created_before"
            type="text"
          />
        </label>
        <button type="submit">{labels.apply}</button>
      </fieldset>
    </form>
  );
}

function paramsFromForm(form: HTMLFormElement): ActivityListParams {
  const data = new FormData(form);
  return {
    action: stringValue(data, "action"),
    actor: stringValue(data, "actor"),
    createdAfter: stringValue(data, "created_after"),
    createdBefore: stringValue(data, "created_before"),
    matter: stringValue(data, "matter"),
    targetType: stringValue(data, "target_type"),
  };
}

function stringValue(data: FormData, key: string): string | undefined {
  const value = data.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
