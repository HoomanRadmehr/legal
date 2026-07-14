import type { NotificationListParams } from "./types";

export const notificationQueryKeys = {
  all: ["api", "notifications"] as const,
  list: (params: NotificationListParams) =>
    [...notificationQueryKeys.all, "list", params] as const,
  preferences: ["api", "notification-preferences"] as const,
  unread: ["api", "notifications", "unread"] as const,
};
