import { afterEach, describe, expect, test, vi } from "vitest";

import { createApiClient } from "../api/client";
import type { AuthSession } from "./api";
import {
  clearAuthSession,
  configureSessionRefresh,
  getAccessToken,
  refreshSessionOnce,
  resetSessionState,
  setAuthSession,
} from "./session";

afterEach(() => {
  resetSessionState();
  vi.restoreAllMocks();
});

describe("auth session memory", () => {
  test("keeps the access token in memory only", () => {
    localStorage.clear();
    sessionStorage.clear();

    setAuthSession(buildSession("memory-token"));

    expect(getAccessToken()).toBe("memory-token");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    clearAuthSession();

    expect(getAccessToken()).toBeNull();
  });

  test("shares one refresh promise for parallel 401 replay", async () => {
    let refreshCalls = 0;
    setAuthSession(buildSession("stale-token"));
    configureSessionRefresh(async () => {
      refreshCalls += 1;
      await Promise.resolve();
      return buildSession("fresh-token");
    });

    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === "Bearer stale-token") {
          return unauthorizedResponse();
        }
        return Response.json({ ok: true });
      },
    );
    const client = createApiClient({
      baseUrl: "/api/v1",
      fetchImpl,
      getAccessToken,
      refreshAccessToken: async () => {
        const session = await refreshSessionOnce();
        return session?.access ?? null;
      },
    });

    const results = await Promise.all([
      client.request<{ ok: boolean }>("/matters/"),
      client.request<{ ok: boolean }>("/notices/"),
    ]);

    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(refreshCalls).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  test("limits replay to one attempt after refresh", async () => {
    let refreshCalls = 0;
    setAuthSession(buildSession("stale-token"));
    configureSessionRefresh(async () => {
      refreshCalls += 1;
      return buildSession("fresh-token");
    });

    const fetchImpl = vi.fn(async () => unauthorizedResponse());
    const client = createApiClient({
      baseUrl: "/api/v1",
      fetchImpl,
      getAccessToken,
      refreshAccessToken: async () => {
        const session = await refreshSessionOnce();
        return session?.access ?? null;
      },
    });

    await expect(client.request("/matters/")).rejects.toMatchObject({
      status: 401,
    });
    expect(refreshCalls).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test("does not persist or log token values when refresh fails", async () => {
    localStorage.clear();
    sessionStorage.clear();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const storageSet = vi.spyOn(Storage.prototype, "setItem");
    let refreshCalls = 0;
    setAuthSession(buildSession("stale-secret-token"));
    configureSessionRefresh(async () => {
      refreshCalls += 1;
      throw new Error("fresh-secret-token");
    });

    const fetchImpl = vi.fn(async () => unauthorizedResponse());
    const client = createApiClient({
      baseUrl: "/api/v1",
      fetchImpl,
      getAccessToken,
      refreshAccessToken: async () => {
        const session = await refreshSessionOnce();
        return session?.access ?? null;
      },
    });

    await expect(client.request("/documents/")).rejects.toMatchObject({
      status: 401,
    });
    const consoleText = consoleError.mock.calls.flat().join(" ");

    expect(refreshCalls).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(storageSet).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(consoleText).not.toContain("stale-secret-token");
    expect(consoleText).not.toContain("fresh-secret-token");
  });
});

function buildSession(access: string): AuthSession {
  return {
    access,
    membership: {
      organization_id: "org-1",
      organization_name: "Acme Legal",
      role: "legal_counsel",
    },
    user: {
      display_name: "Ava Counsel",
      id: "user-1",
      preferred_language: "en",
    },
  };
}

function unauthorizedResponse(): Response {
  return Response.json(
    {
      code: "authentication_required",
      details: {},
      message: "Authentication required.",
    },
    { status: 401 },
  );
}
