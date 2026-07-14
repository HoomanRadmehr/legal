import { apiClient, type QueryValue } from "../../api/client";
import type {
  NoticeDetail,
  NoticeInput,
  NoticeListItem,
  NoticeListParams,
  NoticeTimelineEvent,
  NoticeUpdateInput,
  PaginatedResponse,
} from "./types";

export async function listNotices(
  params: NoticeListParams = {},
): Promise<PaginatedResponse<NoticeListItem>> {
  return apiClient.request<PaginatedResponse<NoticeListItem>>("/notices/", {
    query: buildNoticeListQuery(params),
  });
}

export async function getNotice(noticeId: string): Promise<NoticeDetail> {
  return apiClient.request<NoticeDetail>(`/notices/${noticeId}/`);
}

export async function createNotice(input: NoticeInput): Promise<NoticeDetail> {
  return apiClient.request<NoticeDetail>("/notices/", {
    body: input,
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function updateNotice(
  noticeId: string,
  input: NoticeUpdateInput,
): Promise<NoticeDetail> {
  return apiClient.request<NoticeDetail>(`/notices/${noticeId}/`, {
    body: input,
    method: "PATCH",
    replayOnUnauthorized: false,
  });
}

export async function archiveNotice(
  noticeId: string,
  version: number,
): Promise<NoticeDetail> {
  return apiClient.request<NoticeDetail>(`/notices/${noticeId}/archive/`, {
    body: { version },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function listNoticeTimeline(
  noticeId: string,
): Promise<NoticeTimelineEvent[]> {
  return apiClient.request<NoticeTimelineEvent[]>(
    `/notices/${noticeId}/timeline/`,
  );
}

export function buildNoticeListQuery(
  params: NoticeListParams,
): Record<string, QueryValue> {
  return {
    archived: params.archived,
    ordering: params.ordering,
    overdue: params.overdue,
    owner: emptyToUndefined(params.owner),
    page: params.page,
    received_after: emptyToUndefined(params.receivedAfter),
    received_before: emptyToUndefined(params.receivedBefore),
    response_deadline_after: emptyToUndefined(params.responseDeadlineAfter),
    response_deadline_before: emptyToUndefined(params.responseDeadlineBefore),
    response_status: emptyToUndefined(params.responseStatus),
    search: emptyToUndefined(params.search),
    sender: emptyToUndefined(params.sender),
    status: emptyToUndefined(params.status),
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
