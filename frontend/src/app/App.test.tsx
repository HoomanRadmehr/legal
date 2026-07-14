import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { App } from "./App";
import { resetAuthForTests } from "../auth";
import { createAppQueryClient } from "./queryClient";
import { RouteErrorState } from "./routeError";
import { appRoutes } from "./routes";
import { AppProviders } from "./providers";

afterEach(() => {
  resetAuthForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("renders the protected app shell after session restore", async () => {
  stubFetchWithRestoredSession();

  render(<App />);

  expect(
    await screen.findByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Signed in as Ava Counsel/i)).toBeInTheDocument();
});

test("renders the public login route", async () => {
  stubFetchWithAnonymousSession();

  renderAppRoute("/login");

  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
});

test("renders the not found route placeholder", () => {
  stubFetchWithAnonymousSession();

  renderAppRoute("/missing");

  expect(
    screen.getByRole("heading", { name: "Page not found" }),
  ).toBeInTheDocument();
});

test("contains unexpected render errors without exposing raw details", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <BrokenRoute />,
        errorElement: <RouteErrorState />,
      },
    ],
    { initialEntries: ["/"] },
  );

  render(
    <QueryClientProvider client={createAppQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  expect(
    screen.queryByText(/sensitive render detail/i),
  ).not.toBeInTheDocument();
});

function renderAppRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

function BrokenRoute(): ReactNode {
  throw new Error("sensitive render detail");
}

function stubFetchWithRestoredSession() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (requestPath(input) === "/api/v1/auth/csrf/") {
        return new Response(null, { status: 204 });
      }
      if (
        requestPath(input) === "/api/v1/auth/refresh/" &&
        init?.method === "POST"
      ) {
        return Response.json({
          access: "restored-token",
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
        });
      }

      return new Response(null, { status: 204 });
    }),
  );
}

function stubFetchWithAnonymousSession() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (requestPath(input) === "/api/v1/auth/csrf/") {
        return new Response(null, { status: 204 });
      }

      return Response.json(
        {
          code: "authentication_required",
          details: {},
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }),
  );
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
