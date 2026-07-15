import { render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";

import { resetAuthForTests } from "../../auth";
import type { AuthSession } from "../../auth/api";
import {
  ROLE_LEGAL_ADMIN,
  ROLE_LEGAL_COUNSEL,
  ROLE_LEGAL_MANAGER,
  ROLE_VIEWER,
  type MembershipRole,
} from "../../auth/permissions";
import { AppProviders } from "../../app/providers";
import { appRoutes } from "../../app/routes";
import { I18nProvider, type SupportedLocale } from "../../i18n";
import { AppShell, RoleActionBar } from "./AppShell";

afterEach(() => {
  resetAuthForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("app shell permissions", () => {
  test("shows admin navigation and elevated actions for legal admins", () => {
    renderShell(ROLE_LEGAL_ADMIN);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(
      screen.getByRole("link", { name: "Invite user" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Offboarding" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create matter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit matter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload document" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Transfer owner" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Run offboarding" }),
    ).toBeInTheDocument();
  });

  test("shows manager operational actions without admin-only routes", () => {
    renderShell(ROLE_LEGAL_MANAGER);

    expect(screen.getByRole("link", { name: "Activity" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Admin" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Invite user" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Offboarding" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create matter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Transfer owner" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Run offboarding" }),
    ).not.toBeInTheDocument();
  });

  test("keeps counsel away from owner transfer and offboarding controls", () => {
    renderShell(ROLE_LEGAL_COUNSEL);

    expect(
      screen.getByRole("button", { name: "Create matter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit matter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload document" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Transfer owner" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Run offboarding" }),
    ).not.toBeInTheDocument();
  });

  test("renders viewer as read-only without mutation controls", () => {
    renderShell(ROLE_VIEWER);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create matter" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit matter" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload document" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Transfer owner" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Run offboarding" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Viewer access is read-only.")).toBeInTheDocument();
  });

  test("renders Persian sidebar labels and RTL shell placement", () => {
    renderShell(ROLE_LEGAL_ADMIN, "fa");

    const workspace = screen.getByLabelText("محیط کار");
    expect(workspace.closest(".layout-shell")).toHaveClass("layout-shell--rtl");
    expect(
      screen.getByRole("navigation", { name: "ناوبری اصلی" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "داشبورد" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "اسناد" })).toHaveAttribute(
      "href",
      "/documents",
    );
    expect(screen.getByRole("link", { name: "دعوت کاربر" })).toHaveAttribute(
      "href",
      "/admin/users/new",
    );
    expect(
      screen.getByRole("button", { name: "بارگذاری سند" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "خروج" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  test("handles direct admin-route denial without hidden details", async () => {
    stubFetchWithSession(ROLE_VIEWER);
    renderRoute("/admin/offboarding");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "دسترسی رد شد",
    );
    expect(screen.queryByText(/offboarding preview/i)).not.toBeInTheDocument();
  });

  test("shows confidential backend not-found state safely", async () => {
    stubFetchWithSession(ROLE_LEGAL_COUNSEL);
    renderRoute("/matters/not-visible");

    expect(
      await screen.findByRole("heading", { name: "Record not found" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/confidential/i)).not.toBeInTheDocument();
  });
});

function renderShell(role: MembershipRole, locale: SupportedLocale = "en") {
  render(
    <MemoryRouter>
      <I18nProvider initialLocale={locale}>
        <AppShell onLogout={() => undefined} session={buildSession(role)}>
          <RoleActionBar role={role} />
        </AppShell>
      </I18nProvider>
    </MemoryRouter>,
  );
}

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

function stubFetchWithSession(role: MembershipRole) {
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
        return Response.json(buildSession(role));
      }

      return new Response(null, { status: 204 });
    }),
  );
}

function buildSession(role: MembershipRole): AuthSession {
  return {
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
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
