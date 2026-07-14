import { describe, expect, test } from "vitest";

import { isApiError, parseApiErrorResponse, parseRetryAfter } from "./errors";

describe("API error parser", () => {
  test("parses the backend error envelope with retry and request metadata", async () => {
    const response = new Response(
      JSON.stringify({
        code: "rate_limit_exceeded",
        message: "Too many requests.",
        details: { retry_after: 42 },
        request_id: "request-from-body",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "42",
          "X-Request-ID": "request-from-header",
        },
      },
    );

    const error = parseApiErrorResponse(response, await response.json());

    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({
      status: 429,
      code: "rate_limit_exceeded",
      message: "Too many requests.",
      details: { retry_after: 42 },
      requestId: "request-from-body",
      retryAfterSeconds: 42,
    });
  });

  test("uses a safe fallback for non-envelope responses", () => {
    const response = new Response("server stack trace", {
      status: 500,
      headers: { "X-Request-ID": "request-from-header" },
    });

    const error = parseApiErrorResponse(response, "server stack trace");

    expect(error.message).toBe("The server is temporarily unavailable.");
    expect(error.code).toBe("request_failed");
    expect(error.details).toEqual({});
    expect(error.requestId).toBe("request-from-header");
    expect(error.message).not.toContain("stack trace");
  });

  test("parses numeric and date retry-after values", () => {
    const retryDate = new Date(Date.now() + 10_000).toUTCString();

    expect(parseRetryAfter("7")).toBe(7);
    expect(parseRetryAfter(retryDate)).toBeGreaterThan(0);
    expect(parseRetryAfter("not-a-date")).toBeUndefined();
  });
});
