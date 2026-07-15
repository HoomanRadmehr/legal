import { useQuery } from "@tanstack/react-query";

import { listActivity, listMatterTimeline } from "./api";
import type { ActivityListParams } from "./types";

export const activityQueryKeys = {
  all: ["api", "activity"] as const,
  list: (params: ActivityListParams) =>
    [...activityQueryKeys.all, "list", params] as const,
  matterTimeline: (matterId: string, params: ActivityListParams) =>
    [...activityQueryKeys.all, "matter", matterId, "timeline", params] as const,
};

export function useActivityList(params: ActivityListParams) {
  return useQuery({
    queryFn: () => listActivity(params),
    queryKey: activityQueryKeys.list(params),
  });
}

export function useMatterTimeline(
  matterId: string,
  params: ActivityListParams = {},
) {
  return useQuery({
    enabled: matterId.length > 0,
    queryFn: () => listMatterTimeline(matterId, params),
    queryKey: activityQueryKeys.matterTimeline(matterId, params),
  });
}
