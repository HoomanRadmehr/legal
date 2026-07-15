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

import { appRoutes } from "../../../app/routes";
import { AppProviders } from "../../../app/providers";
import { createAppQueryClient } from "../../../app/queryClient";
import { resetAuthForTests } from "../../../auth";
import { I18nProvider } from "../../../i18n";
import { InvitationAcceptancePage } from "../pages";

afterEach(() => {
  resetAuthForTests();
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("public route renders without an authenticated session", async () => {
  vi.stubGlobal("fetch", publicRouteFetch());
  const router = createMemoryRouter(appRoutes, {
    initialEntries: ["/accept-invitation#token=route-token"],
  });

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  expect(
    await screen.findByRole("heading", { name: "پذیرش دعوت‌نامه" }),
  ).toBeInTheDocument();
});

test("accepts an invitation without logging in or storing tokens", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async () => Response.json({ status: "accepted" }));
  vi.stubGlobal("fetch", fetchImpl);

  renderInvitationPage("signed-token%3Apart");
  await fillPasswordForm(user);
  await user.click(screen.getByRole("button", { name: "Activate account" }));

  await waitFor(() => expect(fetchImpl).toHaveBeenCalledOnce());
  const [url, init] = fetchImpl.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ];
  expect(url).toContain("/api/v1/auth/invitations/accept/");
  expect(init).toMatchObject({ method: "POST" });
  expect(new Headers(init.headers).get("Authorization")).toBeNull();
  expect(JSON.parse(String(init.body))).toEqual({
    password: "StrongPass123!",
    password_confirm: "StrongPass123!",
    token: "signed-token:part",
  });
  expect(await screen.findByRole("status")).toHaveTextContent("Sign in");
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
});

test("requires a token in the hash fragment", () => {
  const fetchImpl = vi.fn();
  vi.stubGlobal("fetch", fetchImpl);

  renderInvitationPage("");

  expect(screen.getByRole("alert")).toHaveTextContent("missing its token");
  expect(
    screen.queryByRole("button", { name: "Activate account" }),
  ).not.toBeInTheDocument();
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("validates password confirmation before submitting", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn();
  vi.stubGlobal("fetch", fetchImpl);

  renderInvitationPage("valid-token");
  await user.type(screen.getByLabelText("New password"), "StrongPass123!");
  await user.type(
    screen.getByLabelText("Confirm new password"),
    "Different123!",
  );
  await user.click(screen.getByRole("button", { name: "Activate account" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Password confirmation does not match.",
  );
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("shows invalid invitations generically without echoing the token", async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "invitation_invalid",
          details: {},
          message: "Invitation is invalid.",
        },
        { status: 400 },
      ),
    ),
  );

  renderInvitationPage("secret-token");
  await fillPasswordForm(user);
  await user.click(screen.getByRole("button", { name: "Activate account" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Request a new invitation",
  );
  expect(screen.queryByText("secret-token")).not.toBeInTheDocument();
});

test("maps backend password validation details to the form", async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "validation_error",
          details: { password: ["This password is too common."] },
          message: "Invalid request.",
        },
        { status: 400 },
      ),
    ),
  );

  renderInvitationPage("valid-token");
  await fillPasswordForm(user);
  await user.click(screen.getByRole("button", { name: "Activate account" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This password is too common.",
  );
});

test("shows safe retry guidance for rate limits", async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "rate_limit_exceeded",
          details: {},
          message: "Too many requests.",
        },
        { headers: { "Retry-After": "17" }, status: 429 },
      ),
    ),
  );

  renderInvitationPage("valid-token");
  await fillPasswordForm(user);
  await user.click(screen.getByRole("button", { name: "Activate account" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("17 seconds");
});

test("renders Persian labels and RTL direction", () => {
  vi.stubGlobal("fetch", vi.fn());

  renderInvitationPage("valid-token", { initialLocale: "fa" });

  expect(document.documentElement.dir).toBe("rtl");
  expect(
    screen.getByRole("heading", { name: "پذیرش دعوت‌نامه" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("گذرواژه جدید")).toBeInTheDocument();
});

function renderInvitationPage(
  token: string,
  { initialLocale = "en" }: { initialLocale?: "en" | "fa" } = {},
) {
  const hash = token ? `#token=${token}` : "";
  window.history.pushState({}, "", `/accept-invitation${hash}`);
  renderWithProviders(<InvitationAcceptancePage />, { initialLocale });
}

function renderWithProviders(
  children: ReactNode,
  { initialLocale }: { initialLocale: "en" | "fa" },
) {
  render(
    <I18nProvider initialLocale={initialLocale}>
      <QueryClientProvider client={createAppQueryClient()}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  );
}

async function fillPasswordForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("New password"), "StrongPass123!");
  await user.type(
    screen.getByLabelText("Confirm new password"),
    "StrongPass123!",
  );
}

function publicRouteFetch() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = requestPath(input);
    if (path === "/api/v1/auth/csrf/") {
      return new Response(null, { status: 204 });
    }
    if (path === "/api/v1/auth/refresh/" && init?.method === "POST") {
      return Response.json(
        {
          code: "authentication_required",
          details: {},
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }
    return Response.json({ status: "accepted" });
  });
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
