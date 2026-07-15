import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "./api";

export const dashboardQueryKeys = {
  summary: ["api", "dashboard", "summary"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryFn: getDashboardSummary,
    queryKey: dashboardQueryKeys.summary,
  });
}
