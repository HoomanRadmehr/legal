import type { CaseListParams } from "./types";

export const caseQueryKeys = {
  all: ["api", "cases"] as const,
  detail: (caseId: string) => [...caseQueryKeys.all, "detail", caseId] as const,
  list: (params: CaseListParams) =>
    [...caseQueryKeys.all, "list", params] as const,
  timeline: (caseId: string) =>
    [...caseQueryKeys.all, "timeline", caseId] as const,
};
