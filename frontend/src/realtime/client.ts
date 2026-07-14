import type { WebSocketTicket } from "../auth/api";
import { requestWebSocketTicket } from "../auth/api";
import { isSupportedUserEvent, parseUserEvent } from "./events";
import type { DocumentUploadStatusEvent } from "./events";

export type RealtimeStatus = "connected" | "connecting" | "disconnected";

export type RealtimeClientOptions = {
  onEvent: (event: DocumentUploadStatusEvent) => void;
  onStatusChange?: (status: RealtimeStatus) => void;
  setTimer?: TimerFunction;
  socketFactory?: (url: string) => RealtimeSocket;
};

export type RealtimeConnection = {
  disconnect: () => void;
};

export type RealtimeSocket = {
  close: () => void;
  onclose: ((event?: unknown) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onopen: ((event?: unknown) => void) | null;
};

type TimerFunction = (callback: () => void, delay: number) => unknown;

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000];
const MAX_RECONNECT_DELAY_MS = 10_000;

export function connectUserEvents({
  onEvent,
  onStatusChange,
  setTimer = setTimeout,
  socketFactory = createBrowserSocket,
}: RealtimeClientOptions): RealtimeConnection {
  let closedByClient = false;
  let reconnectCount = 0;
  let socket: RealtimeSocket | null = null;

  async function connect() {
    if (closedByClient) {
      return;
    }
    onStatusChange?.("connecting");
    try {
      const ticket = await requestWebSocketTicket();
      socket = socketFactory(ticketUrl(ticket));
      bindSocket(socket);
    } catch {
      scheduleReconnect();
    }
  }

  function bindSocket(nextSocket: RealtimeSocket) {
    nextSocket.onopen = () => {
      reconnectCount = 0;
      onStatusChange?.("connected");
    };
    nextSocket.onmessage = (message) => handleMessage(message.data, onEvent);
    nextSocket.onerror = () => nextSocket.close();
    nextSocket.onclose = () => {
      onStatusChange?.("disconnected");
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (closedByClient) {
      return;
    }
    const delay =
      RECONNECT_DELAYS_MS[boundedDelayIndex(reconnectCount)] ??
      MAX_RECONNECT_DELAY_MS;
    reconnectCount += 1;
    setTimer(() => void connect(), delay);
  }

  void connect();

  return {
    disconnect: () => {
      closedByClient = true;
      socket?.close();
      onStatusChange?.("disconnected");
    },
  };
}

function createBrowserSocket(url: string): RealtimeSocket {
  return new WebSocket(url) as unknown as RealtimeSocket;
}

function handleMessage(
  data: string,
  onEvent: RealtimeClientOptions["onEvent"],
): void {
  const event = parseUserEvent(safeJson(data));
  if (isSupportedUserEvent(event)) {
    onEvent(event);
  }
}

function safeJson(data: string): unknown {
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return null;
  }
}

function ticketUrl(ticket: WebSocketTicket): string {
  return websocketUrlFromPath(ticket.websocket_url);
}

export function websocketUrlFromPath(path: string): string {
  if (path.startsWith("ws://") || path.startsWith("wss://")) {
    return path;
  }
  const origin = window.location.origin.replace(/^http/, "ws");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function boundedDelayIndex(count: number): number {
  return Math.min(count, RECONNECT_DELAYS_MS.length - 1);
}
