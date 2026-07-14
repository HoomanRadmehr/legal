import type { DeadlineListParams } from "./types";

export const deadlineQueryKeys = {
  all: ["api", "deadlines"] as const,
  detail: (deadlineId: string) =>
    [...deadlineQueryKeys.all, "detail", deadlineId] as const,
  list: (params: DeadlineListParams) =>
    [...deadlineQueryKeys.all, "list", params] as const,
};
