import type { SupportedLocale } from "../../../i18n";
import { formatDateTime as formatLocalizedDateTime } from "../../../i18n/date";
import type { MembershipChoice, TaskStatus } from "../types";

const taskCopy = {
  en: {
    actionFailed: "The action failed.",
    activeAssignee: "Active assignee",
    assigneeInvalid: "Select an active assignee from this organization.",
    assigneeMembershipId: "Assignee membership ID",
    applyFilters: "Apply filters",
    assignee: "Assignee",
    assigneeUnavailable: "Assignees unavailable.",
    assignedNotice: "Showing tasks assigned to me.",
    assignment: "Assignment",
    backToDetail: "Back to detail",
    backToTasks: "Back to tasks",
    cancel: "Cancel task",
    cancelBody: "Cancel this task without deleting the record.",
    cancelledAt: "Cancelled at",
    complete: "Complete task",
    completeBody:
      "Mark this task done. Repeating the action returns the completed state.",
    completedAt: "Completed at",
    create: "Create task",
    createDescription: "Create a matter-linked task with an active assignee.",
    description: "Description",
    detail: "Task detail",
    details: "Task details",
    edit: "Edit task",
    due: "Due",
    dueAfter: "Due after",
    dueBefore: "Due before",
    dueDateTime: "Due date and time",
    empty: "No tasks match the current filters.",
    error: "Task unavailable",
    finalState: "Final state",
    filters: "Task filters",
    listDescription:
      "Review matter work, assignment, due dates, and final states.",
    listTitle: "Tasks",
    loading: "Loading task",
    loadingAssignees: "Loading active assignees.",
    lockedAssignmentHelp:
      "Counsel can update task work, but reassignment is restricted.",
    invalidValue: "Invalid value.",
    loadingList: "Loading tasks",
    matter: "Matter",
    matterTasks: "Matter tasks",
    noDescription: "No description provided.",
    notFound: "Task not found",
    notFoundMessage: "The task could not be found.",
    notSelected: "Not selected",
    ordering: "Ordering",
    save: "Save changes",
    selectAssignee: "Select active assignee",
    selectAssigneeError: "Select an active assignee.",
    status: "Status",
    summary: "Summary",
    taskId: "Task ID",
    title: "Title",
    viewerReadonly: "Viewer access is read-only.",
    saveFailed: "Save failed.",
    stateConflict:
      "The task is already in a final state. Refresh to see the latest status.",
    rateLimited: "Too many requests. Try again{{suffix}}.",
    retrySuffix: " in {{seconds}} seconds",
    versionConflict:
      "This task changed while you were working. Reload before saving to avoid overwriting work.",
    options: {
      anyStatus: "Any status",
      dueSoonest: "Due soonest",
      newest: "Newest created",
      recent: "Recently updated",
      status: "Status",
    },
  },
  fa: {
    actionFailed: "اقدام ناموفق بود.",
    activeAssignee: "مسئول فعال",
    assigneeInvalid: "یک مسئول فعال از این سازمان انتخاب کنید.",
    assigneeMembershipId: "شناسه عضویت مسئول",
    applyFilters: "اعمال فیلترها",
    assignee: "مسئول",
    assigneeUnavailable: "مسئول‌ها در دسترس نیستند.",
    assignedNotice: "کارهای واگذار شده به من نمایش داده می‌شود.",
    assignment: "واگذاری",
    backToDetail: "بازگشت به جزئیات",
    backToTasks: "بازگشت به کارها",
    cancel: "لغو کار",
    cancelBody: "این کار را بدون حذف رکورد لغو کنید.",
    cancelledAt: "لغو شده در",
    complete: "تکمیل کار",
    completeBody:
      "این کار را انجام‌شده علامت بزنید. تکرار اقدام، وضعیت تکمیل‌شده را برمی‌گرداند.",
    completedAt: "تکمیل شده در",
    create: "ایجاد کار",
    createDescription: "یک کار مرتبط با رکورد و مسئول فعال ایجاد کنید.",
    description: "شرح",
    detail: "جزئیات کار",
    details: "جزئیات کار",
    edit: "ویرایش کار",
    due: "سررسید",
    dueAfter: "سررسید بعد از",
    dueBefore: "سررسید قبل از",
    dueDateTime: "تاریخ و زمان سررسید",
    empty: "هیچ کاری با فیلترهای فعلی پیدا نشد.",
    error: "کار در دسترس نیست",
    finalState: "وضعیت نهایی",
    filters: "فیلترهای کار",
    listDescription: "کار رکوردها، واگذاری، سررسید و وضعیت نهایی را بررسی کنید.",
    listTitle: "کارها",
    loading: "در حال بارگذاری کار",
    loadingAssignees: "در حال بارگذاری مسئول‌های فعال.",
    lockedAssignmentHelp:
      "مشاور می‌تواند کار را به‌روزرسانی کند، اما تغییر مسئول محدود است.",
    invalidValue: "مقدار نامعتبر است.",
    loadingList: "در حال بارگذاری کارها",
    matter: "رکورد",
    matterTasks: "کارهای رکورد",
    noDescription: "شرحی ثبت نشده است.",
    notFound: "کار پیدا نشد",
    notFoundMessage: "کار پیدا نشد.",
    notSelected: "انتخاب نشده",
    ordering: "مرتب‌سازی",
    save: "ذخیره تغییرات",
    selectAssignee: "انتخاب مسئول فعال",
    selectAssigneeError: "یک مسئول فعال انتخاب کنید.",
    status: "وضعیت",
    summary: "خلاصه",
    taskId: "شناسه کار",
    title: "عنوان",
    viewerReadonly: "دسترسی مشاهده‌گر فقط خواندنی است.",
    saveFailed: "ذخیره ناموفق بود.",
    stateConflict:
      "این کار از قبل در وضعیت نهایی است. برای دیدن آخرین وضعیت، صفحه را تازه‌سازی کنید.",
    rateLimited: "درخواست‌ها بیش از حد مجاز است.{{suffix}} دوباره تلاش کنید.",
    retrySuffix: " {{seconds}} ثانیه دیگر",
    versionConflict:
      "این کار هنگام کار شما تغییر کرده است. پیش از ذخیره، صفحه را تازه‌سازی کنید تا کار دیگران بازنویسی نشود.",
    options: {
      anyStatus: "هر وضعیت",
      dueSoonest: "نزدیک‌ترین سررسید",
      newest: "جدیدترین ایجاد",
      recent: "تازه‌ترین به‌روزرسانی",
      status: "وضعیت",
    },
  },
};

export function taskText(locale: SupportedLocale) {
  return taskCopy[locale];
}

export function taskStatusLabel(
  status: TaskStatus,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<TaskStatus, string>> = {
    en: {
      cancelled: "Cancelled",
      done: "Done",
      in_progress: "In progress",
      todo: "To do",
    },
    fa: {
      cancelled: "لغوشده",
      done: "انجام‌شده",
      in_progress: "در حال انجام",
      todo: "برای انجام",
    },
  };
  return labels[locale][status] ?? labels.en[status] ?? "Unknown status";
}

export function taskStatusTone(status: TaskStatus) {
  if (status === "done") {
    return "success";
  }
  if (status === "cancelled") {
    return "neutral";
  }
  return "warning";
}

export function membershipRoleLabel(
  role: string,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<string, string>> = {
    en: {
      legal_admin: "Legal admin",
      legal_counsel: "Legal counsel",
      legal_manager: "Legal manager",
      viewer: "Viewer",
    },
    fa: {
      legal_admin: "مدیر حقوقی",
      legal_counsel: "مشاور حقوقی",
      legal_manager: "مدیر پرونده‌ها",
      viewer: "مشاهده‌گر",
    },
  };
  return labels[locale][role] ?? labels.en[role] ?? role;
}

export function membershipChoiceLabel(
  choice: MembershipChoice,
  locale: SupportedLocale = "en",
): string {
  return `${choice.display_name || choice.id} (${membershipRoleLabel(choice.role, locale)})`;
}

export function formatDateTime(
  value: string | null | undefined,
  locale: SupportedLocale = "en",
): string {
  return formatLocalizedDateTime(value, locale);
}
