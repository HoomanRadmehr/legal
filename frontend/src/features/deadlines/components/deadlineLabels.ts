import type { SupportedLocale } from "../../../i18n";
import { formatDateTime as formatLocalizedDateTime } from "../../../i18n/date";
import type { DeadlinePriority, DeadlineStatus, DeadlineView } from "../types";

const deadlineCopy = {
  en: {
    applyFilters: "Apply filters",
    assignee: "Assignee",
    cancel: "Cancel deadline",
    complete: "Complete deadline",
    create: "Create deadline",
    createDescription:
      "Create a matter-linked deadline with an explicit assignee.",
    description: "Description",
    detail: "Deadline detail",
    details: "Deadline details",
    due: "Due",
    dueAfter: "Due after",
    dueBefore: "Due before",
    dueDateTime: "Due date and time",
    empty: "No deadlines match the current view and filters.",
    error: "Deadline unavailable",
    finalState: "Final state",
    filters: "Deadline filters",
    links: "Matter and assignee",
    listDescription:
      "Review deadline views classified by the backend using the organization timezone.",
    listTitle: "Deadlines",
    loading: "Loading deadline",
    loadingList: "Loading deadlines",
    matter: "Matter",
    noDescription: "No description provided.",
    notFound: "Deadline not found",
    notFoundMessage: "The deadline could not be found.",
    openOnly: "Open deadlines",
    ordering: "Ordering",
    priority: "Priority",
    reminder: "Reminder",
    save: "Save changes",
    status: "Status",
    summary: "Summary",
    timezone: "Organization timezone: server classified",
    title: "Title",
    viewTabs: "Deadline views",
    viewerReadonly: "Viewer access is read-only.",
    options: {
      anyPriority: "Any priority",
      dueLatest: "Due latest",
      dueSoonest: "Due soonest",
      priority: "Priority",
      recent: "Recently updated",
    },
    enabled: "Enabled",
    disabled: "Disabled",
    completedAt: "Completed at",
    cancelledAt: "Cancelled at",
    deadlineId: "Deadline ID",
    actionFailed: "The action failed.",
    activeAssignee: "Active assignee",
    assigneeMembershipId: "Assignee membership ID",
    backToDetail: "Back to detail",
    backToDeadlines: "Back to deadlines",
    edit: "Edit deadline",
    invalidValue: "Invalid value.",
    saveFailed: "Save failed.",
    rateLimited: "Too many requests. Try again{{suffix}}.",
    retrySuffix: " in {{seconds}} seconds",
    versionConflict:
      "This deadline changed while you were working. Reload before saving to avoid overwriting work.",
    cancelBody: "Cancel this deadline without deleting the record.",
    completeBody:
      "Mark this deadline completed. Repeating the action returns the completed state from the backend.",
  },
  fa: {
    applyFilters: "اعمال فیلترها",
    assignee: "مسئول",
    cancel: "لغو مهلت",
    complete: "تکمیل مهلت",
    create: "ایجاد مهلت",
    createDescription: "یک مهلت مرتبط با رکورد و مسئول مشخص ایجاد کنید.",
    description: "شرح",
    detail: "جزئیات مهلت",
    details: "جزئیات مهلت",
    due: "سررسید",
    dueAfter: "سررسید بعد از",
    dueBefore: "سررسید قبل از",
    dueDateTime: "تاریخ و زمان سررسید",
    empty: "هیچ مهلتی با نما و فیلترهای فعلی پیدا نشد.",
    error: "مهلت در دسترس نیست",
    finalState: "وضعیت نهایی",
    filters: "فیلترهای مهلت",
    links: "رکورد و مسئول",
    listDescription:
      "نماهای مهلت را که سرور بر اساس منطقه زمانی سازمان دسته‌بندی کرده بررسی کنید.",
    listTitle: "مهلت‌ها",
    loading: "در حال بارگذاری مهلت",
    loadingList: "در حال بارگذاری مهلت‌ها",
    matter: "رکورد",
    noDescription: "شرحی ثبت نشده است.",
    notFound: "مهلت پیدا نشد",
    notFoundMessage: "مهلت پیدا نشد.",
    openOnly: "مهلت‌های باز",
    ordering: "مرتب‌سازی",
    priority: "اولویت",
    reminder: "یادآور",
    save: "ذخیره تغییرات",
    status: "وضعیت",
    summary: "خلاصه",
    timezone: "منطقه زمانی سازمان: دسته‌بندی توسط سرور",
    title: "عنوان",
    viewTabs: "نماهای مهلت",
    viewerReadonly: "دسترسی مشاهده‌گر فقط خواندنی است.",
    options: {
      anyPriority: "هر اولویت",
      dueLatest: "دورترین سررسید",
      dueSoonest: "نزدیک‌ترین سررسید",
      priority: "اولویت",
      recent: "تازه‌ترین به‌روزرسانی",
    },
    enabled: "فعال",
    disabled: "غیرفعال",
    completedAt: "تکمیل شده در",
    cancelledAt: "لغو شده در",
    deadlineId: "شناسه مهلت",
    actionFailed: "اقدام ناموفق بود.",
    activeAssignee: "مسئول فعال",
    assigneeMembershipId: "شناسه عضویت مسئول",
    backToDetail: "بازگشت به جزئیات",
    backToDeadlines: "بازگشت به مهلت‌ها",
    edit: "ویرایش مهلت",
    invalidValue: "مقدار نامعتبر است.",
    saveFailed: "ذخیره ناموفق بود.",
    rateLimited: "درخواست‌ها بیش از حد مجاز است.{{suffix}} دوباره تلاش کنید.",
    retrySuffix: " {{seconds}} ثانیه دیگر",
    versionConflict:
      "این مهلت هنگام کار شما تغییر کرده است. پیش از ذخیره، صفحه را تازه‌سازی کنید تا کار دیگران بازنویسی نشود.",
    cancelBody: "این مهلت را بدون حذف رکورد لغو کنید.",
    completeBody:
      "این مهلت را تکمیل‌شده علامت بزنید. تکرار اقدام، وضعیت تکمیل‌شده را از سرور برمی‌گرداند.",
  },
};

export function deadlineText(locale: SupportedLocale) {
  return deadlineCopy[locale];
}

export function deadlineViewLabel(
  view: DeadlineView,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<DeadlineView, string>> = {
    en: {
      assigned_to_me: "Assigned to me",
      overdue: "Overdue",
      today: "Today",
      upcoming: "Upcoming",
    },
    fa: {
      assigned_to_me: "واگذار شده به من",
      overdue: "گذشته",
      today: "امروز",
      upcoming: "پیش رو",
    },
  };
  return labels[locale][view];
}

export function deadlineStatusLabel(
  status: DeadlineStatus,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<DeadlineStatus, string>> = {
    en: {
      cancelled: "Cancelled",
      completed: "Completed",
      open: "Open",
    },
    fa: {
      cancelled: "لغوشده",
      completed: "تکمیل‌شده",
      open: "باز",
    },
  };
  return labels[locale][status] ?? labels.en[status] ?? "Unknown status";
}

export function deadlinePriorityLabel(
  priority: DeadlinePriority,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<DeadlinePriority, string>> = {
    en: {
      critical: "Critical",
      high: "High",
      low: "Low",
      normal: "Normal",
    },
    fa: {
      critical: "بحرانی",
      high: "زیاد",
      low: "کم",
      normal: "عادی",
    },
  };
  return labels[locale][priority] ?? labels.en[priority] ?? "Unknown priority";
}

export function statusTone(status: DeadlineStatus) {
  if (status === "open") {
    return "warning";
  }
  if (status === "completed") {
    return "success";
  }
  return "neutral";
}

export function formatDateTime(
  value: string | null | undefined,
  locale: SupportedLocale = "en",
): string {
  return formatLocalizedDateTime(value, locale);
}
