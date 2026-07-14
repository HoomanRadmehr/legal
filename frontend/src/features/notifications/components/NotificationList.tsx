import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import type { NotificationItem } from "../types";

export function NotificationList({
  notifications,
  onRead,
  readingId,
}: {
  notifications: NotificationItem[];
  onRead: (notificationId: string) => void;
  readingId?: string;
}) {
  return (
    <PaginatedTable
      caption="Notifications"
      columns={notificationColumns({ onRead, readingId })}
      emptyLabel="No notifications to show."
      getRowKey={(notification) => notification.id}
      pagination={{ page: 1, pageCount: 1 }}
      rows={notifications}
    />
  );
}

function notificationColumns({
  onRead,
  readingId,
}: {
  onRead: (notificationId: string) => void;
  readingId?: string;
}): TableColumn<NotificationItem>[] {
  return [
    {
      header: "Message",
      key: "message",
      render: (notification) => (
        <NotificationMessage notification={notification} />
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (notification) => (
        <NotificationStatus notification={notification} />
      ),
    },
    {
      align: "end",
      header: "Actions",
      key: "actions",
      render: (notification) => (
        <ReadButton
          notification={notification}
          onRead={onRead}
          reading={readingId === notification.id}
        />
      ),
    },
  ];
}

function NotificationMessage({
  notification,
}: {
  notification: NotificationItem;
}) {
  return (
    <div className="notification-message">
      <strong>{notification.title}</strong>
      {notification.body ? <p>{notification.body}</p> : null}
      <small>{eventLabel(notification.event_type)}</small>
    </div>
  );
}

function NotificationStatus({
  notification,
}: {
  notification: NotificationItem;
}) {
  if (notification.read_at) {
    return <StatusBadge label="Read" tone="success" />;
  }
  return <StatusBadge label="Unread" tone="warning" />;
}

function ReadButton({
  notification,
  onRead,
  reading,
}: {
  notification: NotificationItem;
  onRead: (notificationId: string) => void;
  reading: boolean;
}) {
  return (
    <button
      disabled={Boolean(notification.read_at) || reading}
      onClick={() => onRead(notification.id)}
      type="button"
    >
      {reading ? "Marking" : "Mark read"}
    </button>
  );
}

function eventLabel(eventType: string): string {
  if (eventType === "deadline.reminder.created") {
    return "Deadline reminder";
  }
  if (eventType === "document.upload.status_changed") {
    return "Document upload";
  }
  if (eventType === "offboarding.status_changed") {
    return "Offboarding";
  }
  return "Notification";
}
