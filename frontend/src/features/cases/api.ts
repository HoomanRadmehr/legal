import { apiClient, type QueryValue } from "../../api/client";
import type {
  CaseDetail,
  CaseInput,
  CaseListItem,
  CaseListParams,
  CaseTimelineEvent,
  CaseUpdateInput,
  PaginatedResponse,
} from "./types";

export async function listCases(
  params: CaseListParams = {},
): Promise<PaginatedResponse<CaseListItem>> {
  return apiClient.request<PaginatedResponse<CaseListItem>>("/cases/", {
    query: buildCaseListQuery(params),
  });
}

export async function getCase(caseId: string): Promise<CaseDetail> {
  return apiClient.request<CaseDetail>(`/cases/${caseId}/`);
}

export async function createCase(input: CaseInput): Promise<CaseDetail> {
  return apiClient.request<CaseDetail>("/cases/", {
    body: input,
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function updateCase(
  caseId: string,
  input: CaseUpdateInput,
): Promise<CaseDetail> {
  return apiClient.request<CaseDetail>(`/cases/${caseId}/`, {
    body: input,
    method: "PATCH",
    replayOnUnauthorized: false,
  });
}

export async function archiveCase(
  caseId: string,
  version: number,
): Promise<CaseDetail> {
  return apiClient.request<CaseDetail>(`/cases/${caseId}/archive/`, {
    body: { version },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function listCaseTimeline(
  caseId: string,
): Promise<CaseTimelineEvent[]> {
  return apiClient.request<CaseTimelineEvent[]>(`/cases/${caseId}/timeline/`);
}

export function buildCaseListQuery(
  params: CaseListParams,
): Record<string, QueryValue> {
  return {
    archived: params.archived,
    case_type: emptyToUndefined(params.caseType),
    created_after: emptyToUndefined(params.createdAfter),
    created_before: emptyToUndefined(params.createdBefore),
    opened_after: emptyToUndefined(params.openedAfter),
    opened_before: emptyToUndefined(params.openedBefore),
    ordering: params.ordering,
    owner: emptyToUndefined(params.owner),
    page: params.page,
    priority: emptyToUndefined(params.priority),
    search: emptyToUndefined(params.search),
    status: emptyToUndefined(params.status),
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
