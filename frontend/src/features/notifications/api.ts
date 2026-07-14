import { apiClient, type QueryValue } from "../../api/client";
import type {
  NotificationItem,
  NotificationListParams,
  NotificationPreference,
  NotificationPreferenceInput,
  NotificationReadAllResponse,
  PaginatedResponse,
} from "./types";

export async function listNotifications(
  params: NotificationListParams = {},
): Promise<PaginatedResponse<NotificationItem>> {
  return apiClient.request<PaginatedResponse<NotificationItem>>(
    "/notifications/",
    {
      query: notificationListQuery(params),
    },
  );
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationItem> {
  return apiClient.request<NotificationItem>(
    `/notifications/${notificationId}/read/`,
    {
      method: "PATCH",
      replayOnUnauthorized: false,
    },
  );
}

export async function markAllNotificationsRead(): Promise<NotificationReadAllResponse> {
  return apiClient.request<NotificationReadAllResponse>(
    "/notifications/read-all/",
    {
      method: "POST",
      replayOnUnauthorized: false,
    },
  );
}

export async function listNotificationPreferences(): Promise<
  NotificationPreference[]
> {
  return apiClient.request<NotificationPreference[]>(
    "/notification-preferences/",
  );
}

export async function replaceNotificationPreferences(
  preferences: NotificationPreferenceInput[],
): Promise<NotificationPreference[]> {
  return apiClient.request<NotificationPreference[]>(
    "/notification-preferences/",
    {
      body: { preferences },
      method: "PUT",
      replayOnUnauthorized: false,
    },
  );
}

function notificationListQuery(
  params: NotificationListParams,
): Record<string, QueryValue> {
  return {
    event_type: emptyToUndefined(params.eventType),
    page: params.page,
    unread: params.unread,
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
