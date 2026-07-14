import type { ContractListParams } from "./types";

export const contractQueryKeys = {
  all: ["api", "contracts"] as const,
  detail: (contractId: string) =>
    [...contractQueryKeys.all, "detail", contractId] as const,
  list: (params: ContractListParams) =>
    [...contractQueryKeys.all, "list", params] as const,
  timeline: (contractId: string) =>
    [...contractQueryKeys.all, "timeline", contractId] as const,
};
