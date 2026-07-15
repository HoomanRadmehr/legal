import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import { AppProviders } from "../../../app/providers";
import { appRoutes } from "../../../app/routes";
import { resetAuthForTests } from "../../../auth";
import type { AuthSession } from "../../../auth/api";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { ROLE_LEGAL_ADMIN, ROLE_VIEWER } from "../../../auth/permissions";
import { I18nProvider } from "../../../i18n";
import { AdminUserManagementPage } from "../pages";
import type { MembershipListItem } from "../types";

afterEach(() => {
  resetAuthForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("admin views and filters organization users", async () => {
  vi.stubGlobal(
    "fetch",
    membershipFetch([adminMembership(), counselMembership()]),
  );
  const user = userEvent.setup();

  renderManagementPage();

  expect(await screen.findByLabelText("Ava Admin Role")).toBeInTheDocument();
  expect(await screen.findByText("Casey Counsel")).toBeInTheDocument();

  await user.type(screen.getByLabelText("Search users"), "casey");
  expect(screen.queryByLabelText("Ava Admin Role")).not.toBeInTheDocument();
  expect(screen.getByText("Casey Counsel")).toBeInTheDocument();

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Role" }),
    "legal_admin",
  );
  expect(screen.getByText(/No users match/)).toBeInTheDocument();
});

test("role change posts the selected canonical value", async () => {
  const user = userEvent.setup();
  const fetchImpl = membershipFetch([adminMembership(), counselMembership()]);
  vi.stubGlobal("fetch", fetchImpl);

  renderManagementPage();
  await screen.findByText("Casey Counsel");
  await user.selectOptions(
    screen.getByLabelText("Casey Counsel Role"),
    "legal_manager",
  );

  await waitFor(() => expect(rolePostCalls(fetchImpl)).toHaveLength(1));
  const [, init] = rolePostCalls(fetchImpl)[0] as unknown as [
    string,
    RequestInit,
  ];
  expect(JSON.parse(String(init.body))).toEqual({ role: "legal_manager" });
  expect(await screen.findByRole("status")).toHaveTextContent("Role updated.");
});

test("self role change refreshes the authenticated session permissions", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", routeFetchForSelfDemotion());
  const router = createMemoryRouter(appRoutes, {
    initialEntries: ["/admin/users"],
  });

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  await screen.findByLabelText("Ava Admin Role");
  await user.selectOptions(screen.getByLabelText("Ava Admin Role"), "viewer");

  expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
  expect(
    screen.queryByRole("link", { name: "Invite user" }),
  ).not.toBeInTheDocument();
});

test("non-admin direct access receives a safe denial", () => {
  vi.stubGlobal("fetch", vi.fn());

  renderManagementPage({ role: ROLE_VIEWER });

  expect(screen.getByRole("alert")).toHaveTextContent("Access denied");
  expect(screen.queryByText("Organization users")).not.toBeInTheDocument();
});

test("last-admin, stale, rate-limit, permission, and network errors are clear", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi
    .fn()
    .mockResolvedValueOnce(Response.json(paginated([adminMembership()])))
    .mockResolvedValueOnce(apiError("last_admin_required", 409))
    .mockResolvedValueOnce(apiError("conflict", 409))
    .mockResolvedValueOnce(
      apiError("rate_limit_exceeded", 429, { "Retry-After": "14" }),
    )
    .mockResolvedValueOnce(apiError("permission_denied", 403))
    .mockRejectedValueOnce(new Error("offline"));
  vi.stubGlobal("fetch", fetchImpl);

  renderManagementPage();
  await screen.findByLabelText("Ava Admin Role");
  await chooseAdminRole(user, "viewer");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "At least one active Legal Admin",
  );
  await chooseAdminRole(user, "legal_manager");
  expect(await screen.findByRole("alert")).toHaveTextContent("Refresh");
  await chooseAdminRole(user, "legal_counsel");
  expect(await screen.findByRole("alert")).toHaveTextContent("14 seconds");
  await chooseAdminRole(user, "viewer");
  expect(await screen.findByRole("alert")).toHaveTextContent("permission");
  await chooseAdminRole(user, "legal_manager");
  expect(await screen.findByRole("alert")).toHaveTextContent("connection");
});

test("Persian labels render with canonical role values", async () => {
  vi.stubGlobal("fetch", membershipFetch([adminMembership()]));

  renderManagementPage({ initialLocale: "fa" });

  expect(document.documentElement.dir).toBe("rtl");
  expect(
    await screen.findByRole("heading", { name: "کاربران" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("نقش")).toHaveValue("");
  expect(screen.getByRole("option", { name: "مدیر حقوقی" })).toHaveValue(
    "legal_admin",
  );
});

function renderManagementPage({
  initialLocale = "en",
  refresh = vi.fn(),
  role = ROLE_LEGAL_ADMIN,
}: {
  initialLocale?: "en" | "fa";
  refresh?: () => Promise<void>;
  role?: string;
} = {}) {
  renderWithProviders(<AdminUserManagementPage />, {
    initialLocale,
    refresh,
    role,
  });
}

function renderWithProviders(
  children: ReactNode,
  {
    initialLocale,
    refresh,
    role,
  }: {
    initialLocale: "en" | "fa";
    refresh: () => Promise<void>;
    role: string;
  },
) {
  render(
    <I18nProvider initialLocale={initialLocale}>
      <AuthContext.Provider value={authContext(role, refresh)}>
        <QueryClientProvider client={createAppQueryClient()}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

async function chooseAdminRole(
  user: ReturnType<typeof userEvent.setup>,
  role: string,
) {
  await user.selectOptions(screen.getByLabelText("Ava Admin Role"), role);
}

function authContext(
  role: string,
  refresh: () => Promise<void>,
): AuthContextValue {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    refresh,
    session: sessionForRole(role),
    status: "authenticated",
  };
}

function membershipFetch(rows: MembershipListItem[]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (
      requestPath(input) === "/api/v1/memberships/" &&
      init?.method === "GET"
    ) {
      return Response.json(paginated(rows));
    }
    if (requestPath(input).endsWith("/role/") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      return Response.json({ ...rows[1], role: body.role });
    }
    return apiError("not_found", 404);
  });
}

function rolePostCalls(fetchImpl: ReturnType<typeof vi.fn>) {
  return fetchImpl.mock.calls.filter(([input, init]) => {
    return (
      requestPath(input as RequestInfo | URL).endsWith("/role/") &&
      (init as RequestInit | undefined)?.method === "POST"
    );
  });
}

function routeFetchForSelfDemotion() {
  let refreshCount = 0;
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = requestPath(input);
    if (path === "/api/v1/auth/csrf/") {
      return new Response(null, { status: 204 });
    }
    if (path === "/api/v1/auth/refresh/" && init?.method === "POST") {
      refreshCount += 1;
      return Response.json(
        refreshCount === 1
          ? sessionForRole(ROLE_LEGAL_ADMIN)
          : sessionForRole(ROLE_VIEWER),
      );
    }
    if (path === "/api/v1/memberships/") {
      return Response.json(paginated([adminMembership()]));
    }
    if (path === "/api/v1/memberships/membership-admin/role/") {
      return Response.json({ ...adminMembership(), role: ROLE_VIEWER });
    }
    return apiError("not_found", 404);
  });
}

function apiError(
  code: string,
  status: number,
  headers?: Record<string, string>,
): Response {
  return Response.json(
    { code, details: {}, message: "Request failed." },
    { headers, status },
  );
}

function paginated(rows: MembershipListItem[]) {
  return { count: rows.length, next: null, previous: null, results: rows };
}

function sessionForRole(role: string): AuthSession {
  return {
    access: "access-token",
    membership: {
      organization_id: "org-1",
      organization_name: "Acme Legal",
      role,
    },
    user: {
      display_name: "Ava Admin",
      id: "user-admin",
      preferred_language: "en",
    },
  };
}

function adminMembership(): MembershipListItem {
  return {
    created_at: "2026-07-15T08:00:00Z",
    display_name: "Ava Admin",
    email: "ava@example.test",
    id: "membership-admin",
    joined_at: "2026-07-15T08:00:00Z",
    offboarded_at: null,
    organization_id: "org-1",
    role: ROLE_LEGAL_ADMIN,
    status: "active",
    updated_at: "2026-07-15T08:00:00Z",
    user_id: "user-admin",
    user_is_active: true,
  };
}

function counselMembership(): MembershipListItem {
  return {
    ...adminMembership(),
    display_name: "Casey Counsel",
    email: "casey@example.test",
    id: "membership-counsel",
    role: "legal_counsel",
    user_id: "user-counsel",
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
