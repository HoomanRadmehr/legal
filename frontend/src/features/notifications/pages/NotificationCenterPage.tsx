import { Link, useSearchParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { NotificationList } from "../components/NotificationList";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useNotificationRealtimeInvalidation,
  useUnreadNotificationCount,
} from "../hooks";
import type { NotificationListParams } from "../types";
import "../notifications.css";

export function NotificationCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = notificationParamsFromSearch(searchParams);
  const notifications = useNotificationList(params);
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const realtimeStatus = useNotificationRealtimeInvalidation();

  return (
    <main className="notification-page">
      <PageHeader
        eyebrow="Notifications"
        title="Notification center"
        description="Review your own notifications and mark completed items read."
        actions={<Link to="/settings/notifications">Preferences</Link>}
      />
      <NotificationToolbar
        markAllDisabled={
          markAllRead.isPending || unreadCount(unread.data) === 0
        }
        onMarkAll={() => markAllRead.mutate()}
        onUnreadOnly={(unreadOnly) =>
          setSearchParams(paramsToSearch({ ...params, unread: unreadOnly }))
        }
        realtimeStatus={realtimeStatus}
        unreadCount={unreadCount(unread.data)}
        unreadOnly={params.unread === true}
      />
      {notifications.isLoading ? (
        <LoadingState label="Loading notifications" />
      ) : null}
      {notifications.isError ? (
        <NotificationError error={notifications.error} />
      ) : null}
      {notifications.data ? (
        <NotificationList
          notifications={notifications.data.results}
          onRead={(notificationId) => markRead.mutate(notificationId)}
          readingId={markRead.variables}
        />
      ) : null}
    </main>
  );
}

function NotificationToolbar({
  markAllDisabled,
  onMarkAll,
  onUnreadOnly,
  realtimeStatus,
  unreadCount,
  unreadOnly,
}: {
  markAllDisabled: boolean;
  onMarkAll: () => void;
  onUnreadOnly: (unreadOnly: boolean) => void;
  realtimeStatus: string;
  unreadCount: number;
  unreadOnly: boolean;
}) {
  return (
    <div className="notification-toolbar">
      <p className="notification-badge" aria-live="polite">
        {unreadCount} unread
      </p>
      <label>
        <input
          checked={unreadOnly}
          onChange={(event) => onUnreadOnly(event.target.checked)}
          type="checkbox"
        />
        Unread only
      </label>
      <button disabled={markAllDisabled} onClick={onMarkAll} type="button">
        Mark all read
      </button>
      <span className="notification-realtime">Realtime: {realtimeStatus}</span>
    </div>
  );
}

function NotificationError({ error }: { error: Error }) {
  return (
    <ErrorState
      title="Notifications unavailable"
      message={errorMessage(error)}
      retryAfterSeconds={
        isApiError(error) ? error.retryAfterSeconds : undefined
      }
    />
  );
}

function notificationParamsFromSearch(
  searchParams: URLSearchParams,
): NotificationListParams {
  return {
    eventType: searchParams.get("event_type") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    unread: searchParams.get("unread") === "true" ? true : undefined,
  };
}

function paramsToSearch(params: NotificationListParams): URLSearchParams {
  const search = new URLSearchParams();
  appendParam(search, "event_type", params.eventType);
  appendParam(search, "page", params.page);
  appendParam(search, "unread", params.unread);
  return search;
}

function appendParam(
  search: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value !== undefined && value !== "") {
    search.set(key, String(value));
  }
}

function unreadCount(data: { count: number } | undefined): number {
  return data?.count ?? 0;
}

function errorMessage(error: Error): string {
  if (
    "retryAfterSeconds" in error &&
    typeof error.retryAfterSeconds === "number"
  ) {
    return `${error.message} Try again in ${error.retryAfterSeconds} seconds.`;
  }
  return error.message;
}
