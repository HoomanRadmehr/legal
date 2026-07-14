import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import { I18nProvider } from "../../../i18n";
import { NotificationCenterPage } from "../pages/NotificationCenterPage";
import { NotificationPreferencesPage } from "../pages/NotificationPreferencesPage";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("notification center reads list, hides raw data, and marks items read", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) =>
    notificationResponse(String(input)),
  );
  vi.stubGlobal("fetch", fetchImpl);
  vi.stubGlobal("WebSocket", undefined);

  renderWithProviders(<NotificationCenterPage />);
  await screen.findByRole("button", { name: "Mark read" });
  await user.click(screen.getByRole("button", { name: "Mark read" }));

  expect(screen.getByText("1 unread")).toBeInTheDocument();
  expect(screen.queryByText("do-not-render")).not.toBeInTheDocument();
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/notifications/notification-1/read/"),
    expect.objectContaining({ method: "PATCH" }),
  );
});

test("mark all read uses recipient-scoped backend action", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) =>
    notificationResponse(String(input)),
  );
  vi.stubGlobal("fetch", fetchImpl);
  vi.stubGlobal("WebSocket", undefined);

  renderWithProviders(<NotificationCenterPage />);
  await screen.findByRole("button", { name: "Mark all read" });
  await user.click(screen.getByRole("button", { name: "Mark all read" }));

  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/notifications/read-all/"),
    expect.objectContaining({ method: "POST" }),
  );
});

test("preferences save own channel choices with truthful provider messaging", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      preferenceResponse(String(input), init),
  );
  vi.stubGlobal("fetch", fetchImpl);

  renderWithProviders(<NotificationPreferencesPage />);
  await screen.findByText("Deadline reminders");
  await user.click(
    within(
      screen.getByRole("group", { name: "Deadline reminders" }),
    ).getByLabelText(/Email/i),
  );
  await user.click(screen.getByRole("button", { name: "Save preferences" }));

  const putRequest = fetchImpl.mock.calls.find(
    ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
  )?.[1] as RequestInit | undefined;
  expect(
    screen.getAllByText(/backend records skipped delivery/i).length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByLabelText(/recipient|membership|user/i),
  ).not.toBeInTheDocument();
  expect(String(putRequest?.body)).toContain("deadline.reminder.created");
  expect(String(putRequest?.body)).not.toContain("recipient");
});

function renderWithProviders(children: ReactNode) {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <QueryClientProvider client={createAppQueryClient()}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    </I18nProvider>,
  );
}

function notificationResponse(url: string): Response {
  if (url.includes("read-all")) {
    return Response.json({ updated: 1 });
  }
  if (url.includes("/read/")) {
    return Response.json(notificationItem("2027-07-14T10:05:00Z"));
  }
  if (url.includes("unread=true")) {
    return Response.json({ count: 1, next: null, previous: null, results: [] });
  }
  return Response.json({
    count: 1,
    next: null,
    previous: null,
    results: [notificationItem(null)],
  });
}

function preferenceResponse(url: string, init?: RequestInit): Response {
  if (url.includes("notification-preferences") && init?.method === "PUT") {
    return Response.json([]);
  }
  return Response.json([]);
}

function notificationItem(read_at: string | null) {
  return {
    body: "A deadline needs attention.",
    created_at: "2027-07-14T10:00:00Z",
    data: { secret_detail: "do-not-render" },
    event_type: "deadline.reminder.created",
    id: "notification-1",
    read_at,
    recipient_id: "membership-1",
    title: "Deadline reminder",
    updated_at: "2027-07-14T10:00:00Z",
  };
}
