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

test("renders the protected documents route", async () => {
  vi.stubGlobal("WebSocket", undefined);
  stubFetchWithDocumentsRoute();

  renderAppRoute("/documents");

  expect(await screen.findByText("notice.pdf")).toBeInTheDocument();
  expect(screen.getByText("Document vault")).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Page not found" }),
  ).not.toBeInTheDocument();
});

test("renders the public login route", async () => {
  stubFetchWithAnonymousSession();

  renderAppRoute("/login");

  expect(
    await screen.findByRole("heading", { name: "ورود" }),
  ).toBeInTheDocument();
});

test("renders the not found route placeholder", () => {
  stubFetchWithAnonymousSession();

  renderAppRoute("/missing");

  expect(
    screen.getByRole("heading", { name: "صفحه پیدا نشد" }),
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

  expect(screen.getByRole("alert")).toHaveTextContent("خطایی رخ داد");
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

function stubFetchWithDocumentsRoute() {
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
        return Response.json(restoredSession());
      }
      if (requestPath(input) === "/api/v1/documents/") {
        return Response.json(documentPage());
      }

      return new Response(null, { status: 204 });
    }),
  );
}

function restoredSession() {
  return {
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
  };
}

function documentPage() {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        available_at: "2027-07-14T10:05:00Z",
        checksum: "abc",
        content_type: "application/pdf",
        created_at: "2027-07-14T10:00:00Z",
        description: "",
        id: "document-1",
        matter_id: "matter-1",
        original_filename: "notice.pdf",
        revoked_at: null,
        size: 2048,
        status: "available",
        updated_at: "2027-07-14T10:05:00Z",
        upload_session_id: "upload-1",
        uploaded_by_id: "membership-1",
      },
    ],
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
