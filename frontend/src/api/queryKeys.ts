import { isApiError } from "./errors";

export const apiQueryKeys = {
  all: ["api"] as const,
  auth: ["api", "auth"] as const,
  currentUser: ["api", "auth", "me"] as const,
};

export const MAX_GET_RETRY_COUNT = 2;

export function shouldRetryGetQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= MAX_GET_RETRY_COUNT) {
    return false;
  }
  if (!isApiError(error)) {
    return true;
  }

  return error.status === 0 || error.status === 503 || error.status >= 500;
}
