import type { SupportedLocale } from "../../i18n";

const english = {
  actions: "Actions",
  allRead: "Mark all read",
  centerDescription:
    "Review your own notifications and mark completed items read.",
  centerTitle: "Notification center",
  channels: {
    email: {
      label: "Email",
      status: "Delivered by the configured backend mail provider.",
    },
    in_app: {
      label: "In-app",
      status: "Available in the notification center.",
    },
    push: {
      label: "Push",
      status:
        "May be unavailable; backend records skipped delivery when unconfigured.",
    },
    sms: {
      label: "SMS",
      status:
        "May be unavailable; backend records skipped delivery when unconfigured.",
    },
  },
  empty: "No notifications to show.",
  eventLabels: {
    deadline: "Deadline reminder",
    document: "Document upload",
    notification: "Notification",
    offboarding: "Offboarding",
  },
  events: {
    deadline: "Deadline reminders",
    document: "Document upload status",
    notification: "In-app notifications",
    offboarding: "Offboarding status",
  },
  loadingCenter: "Loading notifications",
  loadingPreferences: "Loading notification preferences",
  message: "Message",
  notifications: "Notifications",
  preferences: "Preferences",
  preferencesDescription: "Choose channels for your own notification events.",
  preferencesTitle: "Notification preferences",
  providerNote:
    "Provider availability is enforced by the backend. SMS and push delivery may be skipped safely when providers are not configured.",
  read: "Read",
  realtime: "Realtime: {{status}}",
  retry: "{{message}} Try again in {{seconds}} seconds.",
  save: "Save preferences",
  saving: "Saving",
  status: "Status",
  unavailable: {
    center: "Notifications unavailable",
    preferences: "Preferences unavailable",
    request: "The request could not be completed.",
    failed: "The request failed.",
  },
  unread: "Unread",
  unreadCount: "{{count}} unread",
  unreadOnly: "Unread only",
  markRead: "Mark read",
  marking: "Marking",
};

const persian: typeof english = {
  actions: "اقدام‌ها",
  allRead: "علامت‌گذاری همه به عنوان خوانده‌شده",
  centerDescription:
    "اعلان‌های خود را بررسی کنید و موارد تکمیل‌شده را خوانده‌شده کنید.",
  centerTitle: "مرکز اعلان‌ها",
  channels: {
    email: {
      label: "ایمیل",
      status: "از طریق ارائه‌دهنده ایمیل پیکربندی‌شده در سرور ارسال می‌شود.",
    },
    in_app: {
      label: "درون‌برنامه‌ای",
      status: "در مرکز اعلان‌ها در دسترس است.",
    },
    push: {
      label: "Push",
      status:
        "ممکن است در دسترس نباشد؛ سرور هنگام نبود پیکربندی، ارسال را ردشده ثبت می‌کند.",
    },
    sms: {
      label: "SMS",
      status:
        "ممکن است در دسترس نباشد؛ سرور هنگام نبود پیکربندی، ارسال را ردشده ثبت می‌کند.",
    },
  },
  empty: "اعلانی برای نمایش وجود ندارد.",
  eventLabels: {
    deadline: "یادآور مهلت",
    document: "بارگذاری سند",
    notification: "اعلان",
    offboarding: "خروج کاربر",
  },
  events: {
    deadline: "یادآورهای مهلت",
    document: "وضعیت بارگذاری سند",
    notification: "اعلان‌های درون‌برنامه‌ای",
    offboarding: "وضعیت خروج کاربر",
  },
  loadingCenter: "در حال بارگذاری اعلان‌ها",
  loadingPreferences: "در حال بارگذاری ترجیحات اعلان",
  message: "پیام",
  notifications: "اعلان‌ها",
  preferences: "ترجیحات",
  preferencesDescription: "کانال‌های رویدادهای اعلان خود را انتخاب کنید.",
  preferencesTitle: "ترجیحات اعلان",
  providerNote:
    "در دسترس بودن ارائه‌دهنده‌ها توسط سرور اعمال می‌شود. ارسال SMS و Push در صورت نبود پیکربندی، ایمن رد می‌شود.",
  read: "خوانده‌شده",
  realtime: "لحظه‌ای: {{status}}",
  retry: "{{message}} {{seconds}} ثانیه دیگر تلاش کنید.",
  save: "ذخیره ترجیحات",
  saving: "در حال ذخیره",
  status: "وضعیت",
  unavailable: {
    center: "اعلان‌ها در دسترس نیستند",
    preferences: "ترجیحات در دسترس نیست",
    request: "درخواست کامل نشد.",
    failed: "درخواست ناموفق بود.",
  },
  unread: "خوانده‌نشده",
  unreadCount: "{{count}} خوانده‌نشده",
  unreadOnly: "فقط خوانده‌نشده‌ها",
  markRead: "خوانده‌شده",
  marking: "در حال ثبت",
};

export function notificationText(locale: SupportedLocale) {
  return locale === "fa" ? persian : english;
}

export function fillNotificationText(
  label: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{{${key}}}`, String(value)),
    label,
  );
}
