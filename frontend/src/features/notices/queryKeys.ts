import type { NoticeListParams } from "./types";

export const noticeQueryKeys = {
  all: ["api", "notices"] as const,
  detail: (noticeId: string) =>
    [...noticeQueryKeys.all, "detail", noticeId] as const,
  list: (params: NoticeListParams) =>
    [...noticeQueryKeys.all, "list", params] as const,
  relatedChoices: (search: string) =>
    [...noticeQueryKeys.all, "related-choices", search] as const,
  relatedLinks: (matterIds: string[]) =>
    [...noticeQueryKeys.all, "related-links", matterIds] as const,
  timeline: (noticeId: string) =>
    [...noticeQueryKeys.all, "timeline", noticeId] as const,
};
