import { afterEach, describe, expect, test, vi } from "vitest";

import {
  listNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  replaceNotificationPreferences,
} from "../api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notification API", () => {
  test("lists own notifications with filters", async () => {
    const fetchImpl = vi.fn(async () => Response.json(notificationPage()));
    vi.stubGlobal("fetch", fetchImpl);

    await listNotifications({ page: 2, unread: true });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/notifications/?"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(firstFetchUrl(fetchImpl)).toContain("unread=true");
  });

  test("marks one notification and all notifications read", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("read-all")) {
        return Response.json({ updated: 2 });
      }
      return Response.json(
        notificationItem({ read_at: "2027-07-14T10:05:00Z" }),
      );
    });
    vi.stubGlobal("fetch", fetchImpl);

    await markNotificationRead("notification-1");
    await markAllNotificationsRead();

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/notifications/notification-1/read/"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/notifications/read-all/"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("replaces only own preferences without recipient input", async () => {
    const fetchImpl = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchImpl);

    await replaceNotificationPreferences([
      {
        channel: "email",
        enabled: true,
        event_type: "deadline.reminder.created",
        reminder_offset_minutes: 0,
      },
    ]);
    await listNotificationPreferences();

    const request = firstFetchInit(fetchImpl);
    expect(request?.body).toBe(
      JSON.stringify({
        preferences: [
          {
            channel: "email",
            enabled: true,
            event_type: "deadline.reminder.created",
            reminder_offset_minutes: 0,
          },
        ],
      }),
    );
    expect(request?.body).not.toContain("recipient");
    expect(request?.body).not.toContain("membership");
  });
});

function firstFetchUrl(fetchImpl: ReturnType<typeof vi.fn>): string {
  const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
  return calls[0]?.[0] ?? "";
}

function firstFetchInit(
  fetchImpl: ReturnType<typeof vi.fn>,
): RequestInit | undefined {
  const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
  return calls[0]?.[1];
}

function notificationPage() {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [notificationItem({ read_at: null })],
  };
}

function notificationItem({ read_at }: { read_at: string | null }) {
  return {
    body: "A deadline needs attention.",
    created_at: "2027-07-14T10:00:00Z",
    data: { deadline_id: "deadline-1", secret_detail: "do-not-render" },
    event_type: "deadline.reminder.created",
    id: "notification-1",
    read_at,
    recipient_id: "membership-1",
    title: "Deadline reminder",
    updated_at: "2027-07-14T10:00:00Z",
  };
}
