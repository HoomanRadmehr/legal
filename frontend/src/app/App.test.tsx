import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { App } from "./App";
import { createAppQueryClient } from "./queryClient";
import { RouteErrorState } from "./routeError";
import { appRoutes } from "./routes";
import { AppProviders } from "./providers";

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders the protected app shell placeholder at the root route", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: "Legal workspace" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Protected route")).toBeInTheDocument();
});

test("renders the public login route placeholder", () => {
  renderAppRoute("/login");

  expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByText("Public route")).toBeInTheDocument();
});

test("renders the not found route placeholder", () => {
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
