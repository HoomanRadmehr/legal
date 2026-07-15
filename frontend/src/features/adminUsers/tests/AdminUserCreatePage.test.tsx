import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { AdminUserCreatePage } from "../pages";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("admin invites a user without password or organization fields", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async () => Response.json(invitationResponse()));
  vi.stubGlobal("fetch", fetchImpl);
  stubRandomUuid("99999999-9999-4999-8999-999999999999");

  renderAdminUserPage();
  await fillInviteForm(user);
  await user.click(screen.getByRole("button", { name: "Send invitation" }));

  await waitFor(() => expect(fetchImpl).toHaveBeenCalledOnce());
  const [url, init] = fetchImpl.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ];
  const body = JSON.parse(String(init.body));
  expect(url).toContain("/api/v1/memberships/");
  expect(init).toMatchObject({ method: "POST" });
  expect(new Headers(init.headers).get("Idempotency-Key")).toBe(
    "99999999-9999-4999-8999-999999999999",
  );
  expect(body).toEqual({
    email: "new.user@example.test",
    first_name: "New",
    last_name: "User",
    preferred_language: "fa",
    role: "legal_manager",
  });
  expect(body).not.toHaveProperty("organization_id");
  expect(body).not.toHaveProperty("password");
  expect(await screen.findByRole("status")).toHaveTextContent(
    "new.user@example.test",
  );
});

test("non-admin sees an access denied state", () => {
  renderAdminUserPage({ role: "legal_manager" });

  expect(screen.getByRole("alert")).toHaveTextContent("Access denied");
  expect(
    screen.queryByRole("button", { name: "Send invitation" }),
  ).not.toBeInTheDocument();
});

test("validates email before submitting", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn();
  vi.stubGlobal("fetch", fetchImpl);

  renderAdminUserPage();
  await user.type(screen.getByLabelText("Email"), "not-an-email");
  await user.click(screen.getByRole("button", { name: "Send invitation" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Enter a valid email address.",
  );
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("shows duplicate email and rate limit errors safely", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        {
          code: "user_email_conflict",
          details: {},
          message: "Duplicate.",
        },
        { status: 409 },
      ),
    )
    .mockResolvedValueOnce(
      Response.json(
        {
          code: "rate_limit_exceeded",
          details: {},
          message: "Too many requests.",
        },
        { headers: { "Retry-After": "12" }, status: 429 },
      ),
    );
  vi.stubGlobal("fetch", fetchImpl);

  renderAdminUserPage();
  await fillInviteForm(user);
  await user.click(screen.getByRole("button", { name: "Send invitation" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "A user with this email already exists.",
  );
  await user.click(screen.getByRole("button", { name: "Send invitation" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("12 seconds");
});

test("renders Persian labels and keeps canonical role values", async () => {
  renderAdminUserPage({ initialLocale: "fa" });

  expect(document.documentElement.dir).toBe("rtl");
  expect(
    screen.getByRole("heading", { name: "دعوت کاربر" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("نقش")).toHaveValue("viewer");
  expect(screen.getByRole("option", { name: "مدیر پرونده‌ها" })).toHaveValue(
    "legal_manager",
  );
});

function renderAdminUserPage({
  initialLocale = "en",
  role = "legal_admin",
}: {
  initialLocale?: "en" | "fa";
  role?: string;
} = {}) {
  renderWithProviders(<AdminUserCreatePage />, { initialLocale, role });
}

function renderWithProviders(
  children: ReactNode,
  {
    initialLocale,
    role,
  }: {
    initialLocale: "en" | "fa";
    role: string;
  },
) {
  render(
    <I18nProvider initialLocale={initialLocale}>
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

async function fillInviteForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "new.user@example.test");
  await user.type(screen.getByLabelText("First name"), "New");
  await user.type(screen.getByLabelText("Last name"), "User");
  await user.selectOptions(screen.getByLabelText("Role"), "legal_manager");
  await user.selectOptions(screen.getByLabelText("Preferred language"), "fa");
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
        display_name: "Ava Admin",
        id: "user-1",
        preferred_language: "en",
      },
    },
    status: "authenticated",
  };
}

function invitationResponse() {
  return {
    expires_at: "2026-07-22T08:00:00Z",
    id: "membership-1",
    invitation_id: "invitation-1",
    invitation_status: "pending",
    organization_id: "org-1",
    role: "legal_manager",
    status: "active",
    user_id: "user-2",
  };
}

function stubRandomUuid(value: string): void {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { randomUUID: () => value },
  });
}
