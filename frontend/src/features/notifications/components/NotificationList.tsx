import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { useI18n } from "../../../i18n";
import { notificationText } from "../text";
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
  const { locale } = useI18n();
  const labels = notificationText(locale);

  return (
    <PaginatedTable
      caption={labels.notifications}
      columns={notificationColumns({ locale, onRead, readingId })}
      emptyLabel={labels.empty}
      getRowKey={(notification) => notification.id}
      pagination={{ page: 1, pageCount: 1 }}
      rows={notifications}
    />
  );
}

function notificationColumns({
  locale,
  onRead,
  readingId,
}: {
  locale: ReturnType<typeof useI18n>["locale"];
  onRead: (notificationId: string) => void;
  readingId?: string;
}): TableColumn<NotificationItem>[] {
  const labels = notificationText(locale);

  return [
    {
      header: labels.message,
      key: "message",
      render: (notification) => (
        <NotificationMessage locale={locale} notification={notification} />
      ),
    },
    {
      header: labels.status,
      key: "status",
      render: (notification) => (
        <NotificationStatus locale={locale} notification={notification} />
      ),
    },
    {
      align: "end",
      header: labels.actions,
      key: "actions",
      render: (notification) => (
        <ReadButton
          locale={locale}
          notification={notification}
          onRead={onRead}
          reading={readingId === notification.id}
        />
      ),
    },
  ];
}

function NotificationMessage({
  locale,
  notification,
}: {
  locale: ReturnType<typeof useI18n>["locale"];
  notification: NotificationItem;
}) {
  return (
    <div className="notification-message">
      <strong>{notification.title}</strong>
      {notification.body ? <p>{notification.body}</p> : null}
      <small>{eventLabel(notification.event_type, locale)}</small>
    </div>
  );
}

function NotificationStatus({
  locale,
  notification,
}: {
  locale: ReturnType<typeof useI18n>["locale"];
  notification: NotificationItem;
}) {
  const labels = notificationText(locale);
  if (notification.read_at) {
    return <StatusBadge label={labels.read} tone="success" />;
  }
  return <StatusBadge label={labels.unread} tone="warning" />;
}

function ReadButton({
  locale,
  notification,
  onRead,
  reading,
}: {
  locale: ReturnType<typeof useI18n>["locale"];
  notification: NotificationItem;
  onRead: (notificationId: string) => void;
  reading: boolean;
}) {
  const labels = notificationText(locale);

  return (
    <button
      disabled={Boolean(notification.read_at) || reading}
      onClick={() => onRead(notification.id)}
      type="button"
    >
      {reading ? labels.marking : labels.markRead}
    </button>
  );
}

function eventLabel(
  eventType: string,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const labels = notificationText(locale).eventLabels;
  if (eventType === "deadline.reminder.created") {
    return labels.deadline;
  }
  if (eventType === "document.upload.status_changed") {
    return labels.document;
  }
  if (eventType === "offboarding.status_changed") {
    return labels.offboarding;
  }
  return labels.notification;
}
