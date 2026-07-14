import { requestWebSocketTicket } from "../../auth/api";
import { parseUserEvent, websocketUrlFromPath } from "../../realtime";

export type NotificationRealtimeStatus =
  "connected" | "connecting" | "disconnected";

export type NotificationCreatedEvent = {
  data: {
    notification_id: string;
  };
  event_id: string;
  event_type: "notification.created";
  occurred_at: string;
  version: 1;
};

export type NotificationRealtimeConnection = {
  disconnect: () => void;
};

export type NotificationRealtimeOptions = {
  onNotificationCreated: (event: NotificationCreatedEvent) => void;
  onStatusChange?: (status: NotificationRealtimeStatus) => void;
  setTimer?: TimerFunction;
  socketFactory?: (url: string) => NotificationSocket;
};

export type NotificationSocket = {
  close: () => void;
  onclose: ((event?: unknown) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onopen: ((event?: unknown) => void) | null;
};

type TimerFunction = (callback: () => void, delay: number) => unknown;

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000];
const MAX_RECONNECT_DELAY_MS = 10_000;

export function connectNotificationEvents({
  onNotificationCreated,
  onStatusChange,
  setTimer = setTimeout,
  socketFactory = createSocket,
}: NotificationRealtimeOptions): NotificationRealtimeConnection {
  let closedByClient = false;
  let reconnectCount = 0;
  let socket: NotificationSocket | null = null;

  async function connect() {
    if (closedByClient) {
      return;
    }
    onStatusChange?.("connecting");
    try {
      const ticket = await requestWebSocketTicket();
      socket = socketFactory(websocketUrlFromPath(ticket.websocket_url));
      bindSocket(socket);
    } catch {
      scheduleReconnect();
    }
  }

  function bindSocket(nextSocket: NotificationSocket) {
    nextSocket.onopen = () => {
      reconnectCount = 0;
      onStatusChange?.("connected");
    };
    nextSocket.onmessage = (message) =>
      handleSocketMessage(message.data, onNotificationCreated);
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

function handleSocketMessage(
  data: string,
  onNotificationCreated: (event: NotificationCreatedEvent) => void,
): void {
  const event = parseUserEvent(safeJson(data));
  if (isNotificationCreatedEvent(event)) {
    onNotificationCreated(event);
  }
}

function isNotificationCreatedEvent(
  event: ReturnType<typeof parseUserEvent>,
): event is NotificationCreatedEvent {
  if (
    !event ||
    event.version !== 1 ||
    event.event_type !== "notification.created"
  ) {
    return false;
  }
  return typeof event.data.notification_id === "string";
}

function safeJson(data: string): unknown {
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return null;
  }
}

function createSocket(url: string): NotificationSocket {
  return new WebSocket(url) as unknown as NotificationSocket;
}

function boundedDelayIndex(count: number): number {
  return Math.min(count, RECONNECT_DELAYS_MS.length - 1);
}
