import { describe, expect, test, vi } from "vitest";

import { createApiClient } from "./client";
import { isApiError } from "./errors";

describe("API client", () => {
  test("sends JSON requests with credentials and in-memory access token", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return Response.json(
          { id: "case-1" },
          { headers: { "X-Request-ID": "request-id" } },
        );
      },
    );
    const client = createApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl,
      getAccessToken: () => "access-token",
    });

    const result = await client.request<{ id: string }>("/cases/", {
      body: { title: "Matter" },
      method: "POST",
      query: { include: ["owner", "deadlines"], page: 1, empty: undefined },
    });
    const call = fetchImpl.mock.calls[0];
    if (!call) {
      throw new Error("Expected fetch to be called.");
    }
    const [url, init] = call;
    const headers = new Headers(init?.headers);

    expect(result).toEqual({ id: "case-1" });
    expect(url).toBe(
      "https://api.example.test/api/v1/cases/?include=owner&include=deadlines&page=1",
    );
    expect(init?.credentials).toBe("include");
    expect(init?.body).toBe(JSON.stringify({ title: "Matter" }));
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  test("throws parsed API errors without exposing response bodies", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return Response.json(
          {
            code: "not_found",
            message: "Not found.",
            details: {},
            request_id: "request-id",
          },
          { status: 404 },
        );
      },
    );
    const client = createApiClient({ baseUrl: "/api/v1", fetchImpl });

    await expect(client.request("/cases/private-id/")).rejects.toMatchObject({
      code: "not_found",
      requestId: "request-id",
      status: 404,
    });
  });

  test("converts network failures to safe API errors", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        throw new Error("token-bearing debug message");
      },
    );
    const client = createApiClient({ baseUrl: "/api/v1", fetchImpl });

    try {
      await client.request("/cases/");
      throw new Error("Expected request to fail.");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as Error).message).toBe("Unable to reach the server.");
      expect((error as Error).message).not.toContain("token-bearing");
    }
  });

  test("returns undefined for empty successful responses", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return new Response(null, { status: 204 });
      },
    );
    const client = createApiClient({ baseUrl: "/api/v1", fetchImpl });

    await expect(
      client.request<void>("/auth/logout/", { method: "POST" }),
    ).resolves.toBeUndefined();
  });
});
