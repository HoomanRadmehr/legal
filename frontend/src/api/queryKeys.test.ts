import { describe, expect, test } from "vitest";

import { parseApiErrorResponse } from "./errors";
import {
  MAX_GET_RETRY_COUNT,
  apiQueryKeys,
  shouldRetryGetQuery,
} from "./queryKeys";

describe("API query conventions", () => {
  test("defines stable explicit root query keys", () => {
    expect(apiQueryKeys.all).toEqual(["api"]);
    expect(apiQueryKeys.currentUser).toEqual(["api", "auth", "me"]);
  });

  test("keeps GET retry policy bounded and conservative", () => {
    const notFound = parseApiErrorResponse(
      Response.json({}, { status: 404 }),
      {},
    );
    const unavailable = parseApiErrorResponse(
      Response.json({}, { status: 503 }),
      {},
    );

    expect(MAX_GET_RETRY_COUNT).toBe(2);
    expect(shouldRetryGetQuery(0, unavailable)).toBe(true);
    expect(shouldRetryGetQuery(0, notFound)).toBe(false);
    expect(shouldRetryGetQuery(2, unavailable)).toBe(false);
  });
});
