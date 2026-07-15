import { Link, useSearchParams } from "react-router-dom";

import { isApiError } from "../../../api/errors";
import { useAuth } from "../../../auth";
import { AppShell } from "../../../components/layout/AppShell";
import { PageHeader } from "../../../components/pageHeader";
import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { NotificationList } from "../components/NotificationList";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useNotificationRealtimeInvalidation,
  useUnreadNotificationCount,
} from "../hooks";
import { fillNotificationText, notificationText } from "../text";
import type { NotificationListParams } from "../types";
import "../notifications.css";

export function NotificationCenterPage() {
  const { logout, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <AppShell onLogout={logout} session={session}>
      <NotificationCenterContent />
    </AppShell>
  );
}

function NotificationCenterContent() {
  const { locale } = useI18n();
  const labels = notificationText(locale);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = notificationParamsFromSearch(searchParams);
  const notifications = useNotificationList(params);
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const realtimeStatus = useNotificationRealtimeInvalidation();

  return (
    <section className="notification-page">
      <PageHeader
        eyebrow={labels.notifications}
        title={labels.centerTitle}
        description={labels.centerDescription}
        actions={<Link to="/settings/notifications">{labels.preferences}</Link>}
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
        <LoadingState label={labels.loadingCenter} />
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
    </section>
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
  const { locale } = useI18n();
  const labels = notificationText(locale);

  return (
    <div className="notification-toolbar">
      <p className="notification-badge" aria-live="polite">
        {fillNotificationText(labels.unreadCount, { count: unreadCount })}
      </p>
      <label>
        <input
          checked={unreadOnly}
          onChange={(event) => onUnreadOnly(event.target.checked)}
          type="checkbox"
        />
        {labels.unreadOnly}
      </label>
      <button disabled={markAllDisabled} onClick={onMarkAll} type="button">
        {labels.allRead}
      </button>
      <span className="notification-realtime">
        {fillNotificationText(labels.realtime, { status: realtimeStatus })}
      </span>
    </div>
  );
}

function NotificationError({ error }: { error: Error }) {
  const { locale } = useI18n();
  const labels = notificationText(locale);

  return (
    <ErrorState
      title={labels.unavailable.center}
      message={errorMessage(error, locale)}
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

function errorMessage(
  error: Error,
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const labels = notificationText(locale);
  if (
    "retryAfterSeconds" in error &&
    typeof error.retryAfterSeconds === "number"
  ) {
    return fillNotificationText(labels.retry, {
      message: error.message,
      seconds: error.retryAfterSeconds,
    });
  }
  return error.message;
}
