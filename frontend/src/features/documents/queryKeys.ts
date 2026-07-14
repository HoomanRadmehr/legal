import type { DocumentListParams } from "./types";

export const documentQueryKeys = {
  all: ["api", "documents"] as const,
  list: (params: DocumentListParams) =>
    [...documentQueryKeys.all, "list", params] as const,
  upload: (uploadId: string) =>
    [...documentQueryKeys.all, "uploads", uploadId] as const,
  uploads: ["api", "documents", "uploads"] as const,
};
