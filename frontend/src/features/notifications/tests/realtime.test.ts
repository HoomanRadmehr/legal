import { afterEach, describe, expect, test, vi } from "vitest";

import { requestWebSocketTicket } from "../../../auth/api";
import {
  connectNotificationEvents,
  type NotificationSocket,
} from "../notificationRealtime";

vi.mock("../../../auth/api", () => ({
  requestWebSocketTicket: vi.fn(),
}));

const requestTicketMock = vi.mocked(requestWebSocketTicket);

afterEach(() => {
  vi.clearAllMocks();
});

describe("notification realtime", () => {
  test("handles notification.created as an invalidation hint", async () => {
    const onNotificationCreated = vi.fn();
    const sockets: FakeSocket[] = [];
    requestTicketMock.mockResolvedValueOnce(ticket("ticket-one"));

    connectNotificationEvents({
      onNotificationCreated,
      socketFactory: (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
    });
    await flushPromises();
    sockets[0]?.onmessage?.({ data: JSON.stringify(notificationEvent(1)) });

    expect(onNotificationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { notification_id: "notification-1" },
      }),
    );
  });

  test("ignores unknown event versions and requests a new ticket on reconnect", async () => {
    const onNotificationCreated = vi.fn();
    const sockets: FakeSocket[] = [];
    requestTicketMock
      .mockResolvedValueOnce(ticket("ticket-one"))
      .mockResolvedValueOnce(ticket("ticket-two"));

    connectNotificationEvents({
      onNotificationCreated,
      setTimer: (callback: () => void) => {
        callback();
        return 0;
      },
      socketFactory: (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
    });
    await flushPromises();
    sockets[0]?.onmessage?.({ data: JSON.stringify(notificationEvent(2)) });
    sockets[0]?.onclose?.();
    await flushPromises();

    expect(onNotificationCreated).not.toHaveBeenCalled();
    expect(requestTicketMock).toHaveBeenCalledTimes(2);
    expect(sockets[1]?.url).toContain("ticket=ticket-two");
  });
});

class FakeSocket implements NotificationSocket {
  onclose: ((event?: unknown) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onopen: ((event?: unknown) => void) | null = null;

  constructor(public url: string) {}

  close() {
    this.onclose?.();
  }
}

function ticket(value: string) {
  return {
    expires_at: "2027-07-14T10:01:00Z",
    ticket: value,
    websocket_url: `/ws/v1/events/?ticket=${value}`,
  };
}

function notificationEvent(version: number) {
  return {
    data: { notification_id: "notification-1" },
    event_id: "event-1",
    event_type: "notification.created",
    occurred_at: "2027-07-14T10:00:00Z",
    version,
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
