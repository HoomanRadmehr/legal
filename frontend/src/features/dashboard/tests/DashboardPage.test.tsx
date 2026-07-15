import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import { ROLE_LEGAL_COUNSEL, ROLE_VIEWER } from "../../../auth/permissions";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { DashboardPage } from "../pages/DashboardPage";
import type { DashboardSummary } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("renders dashboard response values and filter-preserving links", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(summary())),
  );

  renderDashboard();

  expect(
    await screen.findByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Organization workload you are allowed to manage."),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("link", { name: /Open visible cases 2/i }),
  ).toHaveAttribute("href", "/cases?status=open");
  expect(
    screen.getByRole("link", { name: /Due today 3 Urgent/i }),
  ).toHaveAttribute("href", "/deadlines?view=today");
  expect(screen.getByRole("link", { name: /Open activity/i })).toHaveAttribute(
    "href",
    "/activity?matter=matter-1",
  );
  expect(screen.queryByText("99")).not.toBeInTheDocument();
});

test("viewer wording avoids organization-wide implication", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(emptySummary())),
  );

  renderDashboard({ role: ROLE_VIEWER });

  expect(
    await screen.findByText("Read-only workload from records you can view."),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("No urgent workload is visible right now."),
  ).toBeInTheDocument();
});

test("counsel wording and Persian RTL labels render", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(summary())),
  );

  renderDashboard({ initialLocale: "fa", role: ROLE_LEGAL_COUNSEL });

  expect(document.documentElement.dir).toBe("rtl");
  expect(
    await screen.findByRole("heading", { name: "داشبورد" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "کارهای حقوقی متعلق به شما یا به‌اشتراک‌گذاشته‌شده با شما.",
    ),
  ).toBeInTheDocument();
  expect((await screen.findAllByText("فوری")).length).toBeGreaterThan(0);
});

test("shows loading and rate-limit states", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        { code: "rate_limit_exceeded", details: {}, message: "Limited." },
        { headers: { "Retry-After": "12" }, status: 429 },
      ),
    ),
  );

  renderDashboard();

  expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard");
  expect(await screen.findByRole("alert")).toHaveTextContent("12 seconds");
});

test("shows generic error without raw server details", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "bad_request",
          details: { secret: "hidden" },
          message: "Stack trace",
        },
        { status: 400 },
      ),
    ),
  );

  renderDashboard();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The dashboard could not be loaded.",
  );
  expect(screen.queryByText("Stack trace")).not.toBeInTheDocument();
  expect(screen.queryByText("hidden")).not.toBeInTheDocument();
});

test("urgent values include text indicators inside cards", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(summary())),
  );

  renderDashboard();

  const deadlines = await screen.findByRole("heading", { name: "Deadlines" });
  expect(
    within(deadlines.closest("section") as HTMLElement).getAllByText("Urgent"),
  ).toHaveLength(2);
});

function renderDashboard({
  initialLocale = "en",
  role = "legal_admin",
}: {
  initialLocale?: "en" | "fa";
  role?: string;
} = {}) {
  render(
    <I18nProvider initialLocale={initialLocale}>
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

function authContext(role: string): AuthContextValue {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    session: {
      access: "access-token",
      membership: {
        organization_id: "org-1",
        organization_name: "Acme Legal",
        role,
      },
      user: {
        display_name: "Ava Counsel",
        id: "user-1",
        preferred_language: "en",
      },
    },
    status: "authenticated",
  };
}

function summary(): DashboardSummary {
  return {
    cases: { high_priority: 1, open: 2, total: 4 },
    contracts: { expiring_soon: 1, total: 3 },
    deadlines: { assigned_to_me: 4, overdue: 1, today: 3, upcoming: 5 },
    notices: { open: 2, response_overdue: 1 },
    recent_activity: [
      {
        action: "case.updated",
        actor_membership_id: "membership-1",
        created_at: "2026-07-15T08:00:00Z",
        id: "activity-1",
        matter_id: "matter-1",
        target_id: "case-1",
        target_type: "case",
      },
    ],
    tasks: { assigned_to_me: 2, overdue: 1 },
  };
}

function emptySummary(): DashboardSummary {
  return {
    cases: { high_priority: 0, open: 0, total: 0 },
    contracts: { expiring_soon: 0, total: 0 },
    deadlines: { assigned_to_me: 0, overdue: 0, today: 0, upcoming: 0 },
    notices: { open: 0, response_overdue: 0 },
    recent_activity: [],
    tasks: { assigned_to_me: 0, overdue: 0 },
  };
}
