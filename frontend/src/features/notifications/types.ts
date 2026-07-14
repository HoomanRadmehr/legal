export type NotificationChannel = "email" | "in_app" | "push" | "sms";

export type NotificationEventType =
  | "deadline.reminder.created"
  | "document.upload.status_changed"
  | "notification.created"
  | "offboarding.status_changed";

export type NotificationItem = {
  body: string;
  created_at: string;
  data: Record<string, unknown>;
  event_type: NotificationEventType | string;
  id: string;
  read_at: string | null;
  recipient_id: string;
  title: string;
  updated_at: string;
};

export type NotificationPreference = {
  channel: NotificationChannel;
  created_at: string;
  enabled: boolean;
  event_type: NotificationEventType | string;
  id: string;
  reminder_offset_minutes: number;
  updated_at: string;
};

export type NotificationPreferenceInput = {
  channel: NotificationChannel;
  enabled: boolean;
  event_type: NotificationEventType;
  reminder_offset_minutes: number;
};

export type NotificationListParams = {
  eventType?: string;
  page?: number;
  unread?: boolean;
};

export type NotificationReadAllResponse = {
  updated: number;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type PreferenceOption = {
  eventType: NotificationEventType;
  label: string;
};

export type ChannelOption = {
  channel: NotificationChannel;
  label: string;
  status: string;
};
