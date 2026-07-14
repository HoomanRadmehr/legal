import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import type { AuthSession } from "../../auth/api";
import { resetAuthForTests } from "../../auth";
import { AppProviders } from "../../app/providers";
import { appRoutes } from "../../app/routes";

afterEach(() => {
  resetAuthForTests();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("auth flow", () => {
  test("restores a session through CSRF bootstrap and refresh", async () => {
    const fetchImpl = stubAuthFetch({
      refreshResponse: () => Response.json(buildSession("restored-token")),
    });

    renderRoute("/");

    expect(
      await screen.findByText(/Signed in as Ava Counsel/i),
    ).toBeInTheDocument();
    expect(requests(fetchImpl)).toContain("GET /api/v1/auth/csrf/");
    expect(requests(fetchImpl)).toContain("POST /api/v1/auth/refresh/");
  });

  test("redirects protected routes when refresh fails", async () => {
    stubAuthFetch();

    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  test("logs in with CSRF and does not persist tokens", async () => {
    const fetchImpl = stubAuthFetch({
      loginResponse: () => Response.json(buildSession("login-token")),
    });

    renderRoute("/login");
    await submitLoginForm();

    expect(
      await screen.findByText(/Signed in as Ava Counsel/i),
    ).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(loginCsrfHeader(fetchImpl)).toBe("csrf-value");
  });

  test("shows a generic invalid-credentials message", async () => {
    stubAuthFetch({
      loginResponse: () =>
        Response.json(
          {
            code: "invalid_credentials",
            details: {},
            message: "Invalid credentials.",
          },
          { status: 401 },
        ),
    });

    renderRoute("/login");
    await submitLoginForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The username or password is incorrect.",
    );
  });

  test("shows safe retry guidance for login throttling", async () => {
    stubAuthFetch({
      loginResponse: () =>
        Response.json(
          {
            code: "rate_limit_exceeded",
            details: {},
            message: "Too many attempts.",
          },
          { headers: { "Retry-After": "30" }, status: 429 },
        ),
    });

    renderRoute("/login");
    await submitLoginForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Try again in 30 seconds.",
    );
  });

  test("distinguishes network failure from invalid credentials", async () => {
    stubAuthFetch({
      loginResponse: () => {
        throw new Error("network down");
      },
    });

    renderRoute("/login");
    await submitLoginForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach the server.",
    );
  });

  test("logout clears state even when the server session is already gone", async () => {
    stubAuthFetch({
      logoutResponse: () =>
        Response.json(
          {
            code: "authentication_required",
            details: {},
            message: "Already signed out.",
          },
          { status: 401 },
        ),
      refreshResponse: () => Response.json(buildSession("restored-token")),
    });

    renderRoute("/");

    await screen.findByText(/Signed in as Ava Counsel/i);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });
});

async function submitLoginForm() {
  await userEvent.type(screen.getByLabelText("Email or username"), "ava");
  await userEvent.type(screen.getByLabelText("Password"), "correct-password");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

function stubAuthFetch(overrides: AuthFetchOverrides = {}) {
  document.cookie = "csrftoken=csrf-value; path=/";
  const fetchImpl = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = requestPath(input);
      const method = init?.method ?? "GET";

      if (path === "/api/v1/auth/csrf/" && method === "GET") {
        return new Response(null, { status: 204 });
      }
      if (path === "/api/v1/auth/refresh/" && method === "POST") {
        return overrides.refreshResponse?.() ?? authErrorResponse();
      }
      if (path === "/api/v1/auth/login/" && method === "POST") {
        return (
          overrides.loginResponse?.() ??
          Response.json(buildSession("login-token"))
        );
      }
      if (path === "/api/v1/auth/logout/" && method === "POST") {
        return (
          overrides.logoutResponse?.() ?? new Response(null, { status: 204 })
        );
      }

      return Response.json(
        { code: "not_found", details: {}, message: "Not found." },
        { status: 404 },
      );
    },
  );
  vi.stubGlobal("fetch", fetchImpl);

  return fetchImpl;
}

type AuthFetchOverrides = {
  loginResponse?: () => Response;
  logoutResponse?: () => Response;
  refreshResponse?: () => Response;
};

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

function authErrorResponse(): Response {
  return Response.json(
    {
      code: "authentication_required",
      details: {},
      message: "Authentication required.",
    },
    { status: 401 },
  );
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}

function requests(fetchImpl: ReturnType<typeof stubAuthFetch>): string[] {
  return fetchImpl.mock.calls.map(([input, init]) => {
    return `${init?.method ?? "GET"} ${requestPath(input)}`;
  });
}

function loginCsrfHeader(fetchImpl: ReturnType<typeof stubAuthFetch>) {
  const call = fetchImpl.mock.calls.find(([input]) => {
    return requestPath(input) === "/api/v1/auth/login/";
  });

  return new Headers(call?.[1]?.headers).get("X-CSRFToken");
}
