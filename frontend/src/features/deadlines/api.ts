import { apiClient, type QueryValue } from "../../api/client";
import type {
  DeadlineDetail,
  DeadlineInput,
  DeadlineListItem,
  DeadlineListParams,
  DeadlineUpdateInput,
  PaginatedResponse,
} from "./types";

export async function listDeadlines(
  params: DeadlineListParams,
): Promise<PaginatedResponse<DeadlineListItem>> {
  return apiClient.request<PaginatedResponse<DeadlineListItem>>("/deadlines/", {
    query: buildDeadlineListQuery(params),
  });
}

export async function getDeadline(deadlineId: string): Promise<DeadlineDetail> {
  return apiClient.request<DeadlineDetail>(`/deadlines/${deadlineId}/`);
}

export async function createDeadline(
  input: DeadlineInput,
): Promise<DeadlineDetail> {
  return apiClient.request<DeadlineDetail>("/deadlines/", {
    body: input,
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function updateDeadline(
  deadlineId: string,
  input: DeadlineUpdateInput,
): Promise<DeadlineDetail> {
  return apiClient.request<DeadlineDetail>(`/deadlines/${deadlineId}/`, {
    body: input,
    method: "PATCH",
    replayOnUnauthorized: false,
  });
}

export async function completeDeadline(
  deadlineId: string,
  version: number,
): Promise<DeadlineDetail> {
  return apiClient.request<DeadlineDetail>(
    `/deadlines/${deadlineId}/complete/`,
    {
      body: { version },
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function cancelDeadline(
  deadlineId: string,
  version: number,
): Promise<DeadlineDetail> {
  return apiClient.request<DeadlineDetail>(`/deadlines/${deadlineId}/cancel/`, {
    body: { version },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export function buildDeadlineListQuery(
  params: DeadlineListParams,
): Record<string, QueryValue> {
  return {
    assignee: emptyToUndefined(params.assignee),
    due_after: emptyToUndefined(params.dueAfter),
    due_before: emptyToUndefined(params.dueBefore),
    matter: emptyToUndefined(params.matter),
    ordering: params.ordering,
    page: params.page,
    priority: emptyToUndefined(params.priority),
    status: emptyToUndefined(params.status),
    view: params.view,
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
