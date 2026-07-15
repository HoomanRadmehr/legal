import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { ROLE_LEGAL_ADMIN } from "../../../auth/permissions";
import { I18nProvider } from "../../../i18n";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityListPage } from "../pages/ActivityListPage";
import type { ActivityItem } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("lists safe activity without rendering raw sensitive values", async () => {
  const fetchImpl = vi.fn(async () => Response.json(activityPage()));
  vi.stubGlobal("fetch", fetchImpl);

  renderActivityRoute("/activity?action=case.created&matter=matter-1");

  expect(await screen.findByText("Case created")).toBeInTheDocument();
  expect(screen.getByText("Status")).toBeInTheDocument();
  expect(screen.getByText("open")).toBeInTheDocument();
  expect(screen.queryByText("password")).not.toBeInTheDocument();
  expect(screen.queryByText("secret")).not.toBeInTheDocument();
  expect(screen.queryByText("unexpected.internal")).not.toBeInTheDocument();
  expect(fetchUrlAt(fetchImpl, 0)).toContain("action=case.created");
  expect(fetchUrlAt(fetchImpl, 0)).toContain("matter=matter-1");
});

test("submits explicit filters to the activity API", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async () => Response.json(emptyActivityPage()));
  vi.stubGlobal("fetch", fetchImpl);

  renderActivityRoute();
  await screen.findByText("No visible activity yet.");
  await user.selectOptions(screen.getByLabelText("Action"), "case.updated");
  await user.type(screen.getByLabelText("Actor membership ID"), "actor-1");
  await user.type(screen.getByLabelText("Matter ID"), "matter-2");
  await user.click(screen.getByRole("button", { name: "Apply filters" }));

  expect(lastFetchUrl(fetchImpl)).toContain("action=case.updated");
  expect(lastFetchUrl(fetchImpl)).toContain("actor=actor-1");
  expect(lastFetchUrl(fetchImpl)).toContain("matter=matter-2");
});

test("shows safe not-visible and rate-limit states", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { code: "not_found", details: {}, message: "hidden matter-1" },
          { status: 404 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          { code: "rate_limit_exceeded", details: {}, message: "Limited." },
          { headers: { "Retry-After": "8" }, status: 429 },
        ),
      ),
  );

  const { unmount } = renderActivityRoute();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Activity is not visible.",
  );
  expect(screen.queryByText("hidden matter-1")).not.toBeInTheDocument();
  unmount();
  renderActivityRoute();
  expect(await screen.findByRole("alert")).toHaveTextContent("8 seconds");
});

test("localizes known action labels in Persian", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(activityPage())),
  );

  renderActivityRoute("/activity", "fa");

  expect(document.documentElement.dir).toBe("rtl");
  expect(await screen.findByText("پرونده ایجاد شد")).toBeInTheDocument();
});

test("timeline uses context fallback and never prints unknown action codes", () => {
  renderWithProviders(
    <ActivityTimeline
      ariaLabel="Contract timeline"
      context="contract"
      emptyLabel="No timeline events yet."
      events={[activityItem({ action: "unexpected.internal" })]}
      isError={false}
      isLoading={false}
    />,
  );

  expect(screen.getByText("Contract activity")).toBeInTheDocument();
  expect(screen.queryByText("unexpected.internal")).not.toBeInTheDocument();
});

function renderActivityRoute(
  route = "/activity",
  initialLocale: "en" | "fa" = "en",
) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<ActivityListPage />} path="/activity" />
      </Routes>
    </MemoryRouter>,
    initialLocale,
  );
}

function renderWithProviders(
  children: React.ReactNode,
  initialLocale: "en" | "fa" = "en",
) {
  return render(
    <I18nProvider initialLocale={initialLocale}>
      <AuthContext.Provider value={authContext()}>
        <QueryClientProvider client={createAppQueryClient()}>
          {children}
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

function authContext(): AuthContextValue {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    session: {
      access: "access-token",
      membership: {
        organization_id: "org-1",
        organization_name: "Acme Legal",
        role: ROLE_LEGAL_ADMIN,
      },
      user: {
        display_name: "Ava Admin",
        id: "user-1",
        preferred_language: "en",
      },
    },
    status: "authenticated",
  };
}

function activityPage() {
  return { count: 1, next: null, previous: null, results: [activityItem()] };
}

function emptyActivityPage() {
  return { count: 0, next: null, previous: null, results: [] };
}

function activityItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    action: "case.created",
    actor_membership_id: "membership-1",
    actor_user_id: "user-1",
    after_values: {
      password: "secret",
      status: "open",
      title: "Visible title",
    },
    before_values: {
      status: "draft",
      title: "Visible title",
    },
    created_at: "2026-07-15T08:00:00Z",
    id: "activity-1",
    matter_id: "matter-1",
    metadata: { presigned_url: "https://secret.example.test" },
    request_id: "request-1",
    target_id: "matter-1",
    target_type: "matter",
    updated_at: "2026-07-15T08:00:00Z",
    ...overrides,
  };
}

function fetchUrlAt(
  fetchImpl: ReturnType<typeof vi.fn>,
  index: number,
): string {
  const call = fetchImpl.mock.calls[index] as [RequestInfo | URL, RequestInit?];
  return String(call[0]);
}

function lastFetchUrl(fetchImpl: ReturnType<typeof vi.fn>): string {
  const call = fetchImpl.mock.calls.at(-1) as [RequestInfo | URL, RequestInit?];
  return String(call[0]);
}
