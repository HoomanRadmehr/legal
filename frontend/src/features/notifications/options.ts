import type { ChannelOption, PreferenceOption } from "./types";

export const NOTIFICATION_EVENTS: PreferenceOption[] = [
  {
    eventType: "notification.created",
    label: "In-app notifications",
  },
  {
    eventType: "deadline.reminder.created",
    label: "Deadline reminders",
  },
  {
    eventType: "document.upload.status_changed",
    label: "Document upload status",
  },
  {
    eventType: "offboarding.status_changed",
    label: "Offboarding status",
  },
];

export const NOTIFICATION_CHANNELS: ChannelOption[] = [
  {
    channel: "in_app",
    label: "In-app",
    status: "Available in the notification center.",
  },
  {
    channel: "email",
    label: "Email",
    status: "Delivered by the configured backend mail provider.",
  },
  {
    channel: "sms",
    label: "SMS",
    status:
      "May be unavailable; backend records skipped delivery when unconfigured.",
  },
  {
    channel: "push",
    label: "Push",
    status:
      "May be unavailable; backend records skipped delivery when unconfigured.",
  },
];
