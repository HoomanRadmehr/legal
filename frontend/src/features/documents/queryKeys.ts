import type { DocumentListParams } from "./types";

export const documentQueryKeys = {
  all: ["api", "documents"] as const,
  detail: (documentId: string) =>
    [...documentQueryKeys.all, "detail", documentId] as const,
  list: (params: DocumentListParams) =>
    [...documentQueryKeys.all, "list", params] as const,
  matterChoices: (query: string) =>
    [...documentQueryKeys.all, "matter-choices", query] as const,
  uploads: ["api", "documents", "direct-uploads"] as const,
};
