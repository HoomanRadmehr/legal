import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  listNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  replaceNotificationPreferences,
} from "./api";
import {
  connectNotificationEvents,
  type NotificationRealtimeStatus,
} from "./notificationRealtime";
import { notificationQueryKeys } from "./queryKeys";
import type {
  NotificationItem,
  NotificationListParams,
  NotificationPreferenceInput,
  PaginatedResponse,
} from "./types";

export function useNotificationList(params: NotificationListParams = {}) {
  return useQuery({
    queryFn: () => listNotifications(params),
    queryKey: notificationQueryKeys.list(params),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryFn: () => listNotifications({ unread: true }),
    queryKey: notificationQueryKeys.unread,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId),
    onSuccess: (notification) =>
      updateNotificationCaches(queryClient, notification),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryFn: listNotificationPreferences,
    queryKey: notificationQueryKeys.preferences,
  });
}

export function useSaveNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: NotificationPreferenceInput[]) =>
      replaceNotificationPreferences(preferences),
    onSuccess: (preferences) => {
      queryClient.setQueryData(notificationQueryKeys.preferences, preferences);
    },
  });
}

export function useNotificationRealtimeInvalidation() {
  const queryClient = useQueryClient();
  const [status, setStatus] =
    useState<NotificationRealtimeStatus>("disconnected");

  useEffect(() => {
    if (typeof WebSocket === "undefined") {
      return undefined;
    }
    const connection = connectNotificationEvents({
      onNotificationCreated: () => {
        void queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.all,
        });
      },
      onStatusChange: (nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus === "connected") {
          void queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.all,
          });
        }
      },
    });
    return () => connection.disconnect();
  }, [queryClient]);

  return status;
}

function updateNotificationCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  notification: NotificationItem,
): void {
  queryClient.setQueriesData(
    { queryKey: notificationQueryKeys.all },
    (data: unknown) => replaceNotificationInPage(data, notification),
  );
  void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
}

function replaceNotificationInPage(
  data: unknown,
  notification: NotificationItem,
) {
  if (!isNotificationPage(data)) {
    return data;
  }
  return {
    ...data,
    results: data.results.map((item) =>
      item.id === notification.id ? notification : item,
    ),
  };
}

function isNotificationPage(
  data: unknown,
): data is PaginatedResponse<NotificationItem> {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { results?: unknown }).results)
  );
}
