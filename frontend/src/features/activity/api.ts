import { apiClient, type QueryValue } from "../../api/client";
import type {
  ActivityItem,
  ActivityListParams,
  PaginatedResponse,
} from "./types";

export async function listActivity(
  params: ActivityListParams = {},
): Promise<PaginatedResponse<ActivityItem>> {
  return apiClient.request<PaginatedResponse<ActivityItem>>("/activity/", {
    query: buildActivityQuery(params),
  });
}

export async function listMatterTimeline(
  matterId: string,
  params: ActivityListParams = {},
): Promise<PaginatedResponse<ActivityItem>> {
  return apiClient.request<PaginatedResponse<ActivityItem>>(
    `/matters/${matterId}/timeline/`,
    { query: buildActivityQuery(params) },
  );
}

export function buildActivityQuery(
  params: ActivityListParams,
): Record<string, QueryValue> {
  return {
    action: emptyToUndefined(params.action),
    actor: emptyToUndefined(params.actor),
    created_after: emptyToUndefined(params.createdAfter),
    created_before: emptyToUndefined(params.createdBefore),
    matter: emptyToUndefined(params.matter),
    page: params.page,
    target_id: emptyToUndefined(params.targetId),
    target_type: emptyToUndefined(params.targetType),
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
