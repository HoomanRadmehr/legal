import type { ChannelOption, PreferenceOption } from "./types";

export const NOTIFICATION_EVENTS: PreferenceOption[] = [
  {
    eventType: "notification.created",
  },
  {
    eventType: "deadline.reminder.created",
  },
  {
    eventType: "document.upload.status_changed",
  },
  {
    eventType: "offboarding.status_changed",
  },
];

export const NOTIFICATION_CHANNELS: ChannelOption[] = [
  {
    channel: "in_app",
  },
  {
    channel: "email",
  },
  {
    channel: "sms",
  },
  {
    channel: "push",
  },
];
