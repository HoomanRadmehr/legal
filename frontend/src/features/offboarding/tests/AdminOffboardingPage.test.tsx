import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { ROLE_LEGAL_ADMIN, ROLE_VIEWER } from "../../../auth/permissions";
import { I18nProvider } from "../../../i18n";
import type { MembershipListItem } from "../../adminUsers/types";
import { AdminOffboardingPage } from "../pages/AdminOffboardingPage";
import type { OffboardingPreview, OffboardingRun } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("non-admin direct access receives a safe denial", () => {
  vi.stubGlobal("fetch", vi.fn());

  renderOffboardingPage({ role: ROLE_VIEWER });

  expect(screen.getByRole("alert")).toHaveTextContent("Access denied");
  expect(
    screen.queryByRole("button", { name: "Preview offboarding" }),
  ).not.toBeInTheDocument();
});

test("admin selects members and renders read-only preview details", async () => {
  const user = userEvent.setup();
  const fetchImpl = offboardingFetch();
  vi.stubGlobal("fetch", fetchImpl);

  renderOffboardingPage();
  await requestPreview(user);

  expect(await screen.findAllByText(/Preview ready/)).toHaveLength(2);
  expect(screen.getByText("CASE-1 - Vendor dispute")).toBeInTheDocument();
  expect(screen.getByText("Review contract (matter-1)")).toBeInTheDocument();
  expect(screen.getByText("view (matter-1)")).toBeInTheDocument();
  expect(screen.queryByText("Offboarding completed")).not.toBeInTheDocument();
  expect(previewCalls(fetchImpl)).toHaveLength(1);
});

test("execute requires explicit confirmation", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", offboardingFetch());

  renderOffboardingPage();
  await requestPreview(user);

  const button = await screen.findByRole("button", {
    name: "Execute offboarding",
  });
  expect(button).toBeDisabled();
  await user.type(screen.getByLabelText("Confirmation"), "OFFBOARD");
  expect(button).toBeEnabled();
});

test("execute retry reuses the same idempotency key", async () => {
  const user = userEvent.setup();
  const fetchImpl = offboardingFetch({
    executeResponses: [
      apiError("temporary_unavailable", 503),
      Response.json(offboardingRun()),
    ],
  });
  vi.stubGlobal("fetch", fetchImpl);
  mockRandomUUID("11111111-1111-4111-8111-111111111111");

  renderOffboardingPage();
  await requestPreview(user);
  await user.type(screen.getByLabelText("Confirmation"), "OFFBOARD");
  await user.click(screen.getByRole("button", { name: "Execute offboarding" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("could not");
  await user.click(screen.getByRole("button", { name: "Execute offboarding" }));

  expect(await screen.findAllByText(/Offboarding completed/)).not.toHaveLength(
    0,
  );
  expect(executeKeys(fetchImpl)).toEqual([
    "11111111-1111-4111-8111-111111111111",
    "11111111-1111-4111-8111-111111111111",
  ]);
});

test("stale preview returns to preview step", async () => {
  const user = userEvent.setup();
  const fetchImpl = offboardingFetch({
    executeResponses: [apiError("offboarding_preview_stale", 409)],
  });
  vi.stubGlobal("fetch", fetchImpl);

  renderOffboardingPage();
  await requestPreview(user);
  await user.type(screen.getByLabelText("Confirmation"), "OFFBOARD");
  await user.click(screen.getByRole("button", { name: "Execute offboarding" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("stale");
  expect(screen.queryByText("CASE-1 - Vendor dispute")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Preview offboarding" }),
  ).toBeEnabled();
});

test("pending execute prevents duplicate submit and shows final result", async () => {
  const user = userEvent.setup();
  const deferred = deferredResponse();
  const fetchImpl = offboardingFetch({ executeResponses: [deferred.promise] });
  vi.stubGlobal("fetch", fetchImpl);

  renderOffboardingPage();
  await requestPreview(user);
  await user.type(screen.getByLabelText("Confirmation"), "OFFBOARD");
  const button = screen.getByRole("button", { name: "Execute offboarding" });

  await user.click(button);
  await user.click(button);
  expect(executeCalls(fetchImpl)).toHaveLength(1);
  deferred.resolve(Response.json(offboardingRun()));

  expect(await screen.findAllByText(/Offboarding completed/)).not.toHaveLength(
    0,
  );
  expect(screen.getByText("completed")).toBeInTheDocument();
});

function renderOffboardingPage({
  initialLocale = "en",
  role = ROLE_LEGAL_ADMIN,
}: {
  initialLocale?: "en" | "fa";
  role?: string;
} = {}) {
  renderWithProviders(<AdminOffboardingPage />, { initialLocale, role });
}

function renderWithProviders(
  children: ReactNode,
  { initialLocale, role }: { initialLocale: "en" | "fa"; role: string },
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

async function requestPreview(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByLabelText("Select departing member");
  await user.selectOptions(
    screen.getByLabelText("Select departing member"),
    "membership-counsel",
  );
  await user.selectOptions(
    screen.getByLabelText("Select replacement member"),
    "membership-manager",
  );
  await user.click(screen.getByRole("button", { name: "Preview offboarding" }));
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
        id: "user-admin",
        preferred_language: "en",
      },
    },
    status: "authenticated",
  };
}

function offboardingFetch({
  executeResponses = [Response.json(offboardingRun())],
}: {
  executeResponses?: Array<Promise<Response> | Response>;
} = {}) {
  const executions = [...executeResponses];
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = requestPath(input);
    if (path === "/api/v1/memberships/") {
      return Response.json(
        paginated([adminMember(), counselMember(), managerMember()]),
      );
    }
    if (path === "/api/v1/offboarding/preview/" && init?.method === "POST") {
      return Response.json(offboardingPreview());
    }
    if (path === "/api/v1/offboarding/execute/" && init?.method === "POST") {
      return await executions.shift();
    }
    return apiError("not_found", 404);
  });
}

function executeCalls(fetchImpl: ReturnType<typeof vi.fn>) {
  return fetchImpl.mock.calls.filter(([input, init]) => {
    return (
      requestPath(input as RequestInfo | URL) ===
        "/api/v1/offboarding/execute/" &&
      (init as RequestInit | undefined)?.method === "POST"
    );
  });
}

function previewCalls(fetchImpl: ReturnType<typeof vi.fn>) {
  return fetchImpl.mock.calls.filter(([input, init]) => {
    return (
      requestPath(input as RequestInfo | URL) ===
        "/api/v1/offboarding/preview/" &&
      (init as RequestInit | undefined)?.method === "POST"
    );
  });
}

function executeKeys(fetchImpl: ReturnType<typeof vi.fn>): string[] {
  return executeCalls(fetchImpl).map(([, init]) => {
    const headers = new Headers((init as RequestInit).headers);
    return headers.get("Idempotency-Key") ?? "";
  });
}

function mockRandomUUID(value: string) {
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
    value as ReturnType<Crypto["randomUUID"]>,
  );
}

function apiError(code: string, status: number): Response {
  return Response.json(
    { code, details: {}, message: "Request failed." },
    { status },
  );
}

function deferredResponse() {
  let resolve: (value: Response) => void = () => undefined;
  const promise = new Promise<Response>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function paginated(rows: MembershipListItem[]) {
  return { count: rows.length, next: null, previous: null, results: rows };
}

function offboardingPreview(): OffboardingPreview {
  return {
    active_access_grants: [
      { id: "access-1", level: "view", matter_id: "matter-1" },
    ],
    counts: {
      active_access_grants: 1,
      open_deadlines: 1,
      open_tasks: 1,
      owned_matters: 1,
    },
    departing: {
      display_name: "Casey Counsel",
      id: "membership-counsel",
      role: "legal_counsel",
    },
    fingerprint: "a".repeat(64),
    open_deadlines: [
      {
        id: "deadline-1",
        matter_id: "matter-1",
        title: "File answer",
        version: 1,
      },
    ],
    open_tasks: [
      {
        id: "task-1",
        matter_id: "matter-1",
        title: "Review contract",
        version: 2,
      },
    ],
    owned_matters: [
      {
        id: "matter-1",
        reference_code: "CASE-1",
        title: "Vendor dispute",
        version: 3,
      },
    ],
    replacement: {
      display_name: "Morgan Manager",
      id: "membership-manager",
      role: "legal_manager",
    },
    warnings: ["Replacement receives all open assignments."],
  };
}

function offboardingRun(): OffboardingRun {
  return {
    departing_membership_id: "membership-counsel",
    executed_at: "2026-07-15T08:00:00Z",
    id: "run-1",
    organization_id: "org-1",
    preview: offboardingPreview(),
    replacement_membership_id: "membership-manager",
    status: "completed",
  };
}

function adminMember(): MembershipListItem {
  return membership("membership-admin", "Ava Admin", "legal_admin");
}

function counselMember(): MembershipListItem {
  return membership("membership-counsel", "Casey Counsel", "legal_counsel");
}

function managerMember(): MembershipListItem {
  return membership("membership-manager", "Morgan Manager", "legal_manager");
}

function membership(
  id: string,
  displayName: string,
  role: MembershipListItem["role"],
): MembershipListItem {
  return {
    created_at: "2026-07-15T08:00:00Z",
    display_name: displayName,
    email: `${id}@example.test`,
    id,
    joined_at: "2026-07-15T08:00:00Z",
    offboarded_at: null,
    organization_id: "org-1",
    role,
    status: "active",
    updated_at: "2026-07-15T08:00:00Z",
    user_id: id.replace("membership", "user"),
    user_is_active: true,
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
