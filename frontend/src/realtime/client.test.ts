import { afterEach, describe, expect, test, vi } from "vitest";

import { requestWebSocketTicket } from "../auth/api";
import { connectUserEvents, websocketUrlFromPath } from "./client";
import type { RealtimeSocket } from "./client";

vi.mock("../auth/api", () => ({
  requestWebSocketTicket: vi.fn(),
}));

const requestTicketMock = vi.mocked(requestWebSocketTicket);

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("realtime client", () => {
  test("requests a fresh one-time ticket before reconnecting", async () => {
    const sockets: FakeSocket[] = [];
    const statuses: string[] = [];
    requestTicketMock
      .mockResolvedValueOnce(ticket("ticket-one"))
      .mockResolvedValueOnce(ticket("ticket-two"));

    connectUserEvents({
      onEvent: vi.fn(),
      onStatusChange: (status) => statuses.push(status),
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
    sockets[0]?.onopen?.();
    sockets[0]?.onclose?.();
    await flushPromises();

    expect(requestTicketMock).toHaveBeenCalledTimes(2);
    expect(sockets.map((socket) => socket.url)).toEqual([
      "ws://localhost:3000/ws/v1/events/?ticket=ticket-one",
      "ws://localhost:3000/ws/v1/events/?ticket=ticket-two",
    ]);
    expect(statuses).toEqual([
      "connecting",
      "connected",
      "disconnected",
      "connecting",
    ]);
  });

  test("ignores unknown event versions safely", async () => {
    const onEvent = vi.fn();
    const sockets: FakeSocket[] = [];
    requestTicketMock.mockResolvedValueOnce(ticket("ticket-one"));

    connectUserEvents({
      onEvent,
      socketFactory: (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
    });
    await flushPromises();
    sockets[0]?.onmessage?.({
      data: JSON.stringify({
        data: { document_id: "document-1", status: "available" },
        event_id: "event-1",
        event_type: "document.upload.status_changed",
        occurred_at: "2027-07-14T10:00:00Z",
        version: 2,
      }),
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  test("ignores malformed messages without console output", async () => {
    const onEvent = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const sockets: FakeSocket[] = [];
    requestTicketMock.mockResolvedValueOnce(ticket("ticket-one"));

    connectUserEvents({
      onEvent,
      socketFactory: (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
    });
    await flushPromises();
    sockets[0]?.onmessage?.({ data: "ticket=secret-ticket" });

    expect(onEvent).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  test("builds websocket URL from published relative path", () => {
    expect(websocketUrlFromPath("/ws/v1/events/?ticket=safe-ticket")).toBe(
      "ws://localhost:3000/ws/v1/events/?ticket=safe-ticket",
    );
  });
});

class FakeSocket implements RealtimeSocket {
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

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
