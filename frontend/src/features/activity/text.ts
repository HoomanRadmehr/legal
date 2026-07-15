import type { SupportedLocale } from "../../i18n";

const english = {
  action: "Action",
  actor: "Actor membership ID",
  allActions: "All actions",
  apply: "Apply filters",
  eyebrow: "Audit trail",
  createdAfter: "Created after",
  createdBefore: "Created before",
  description:
    "Review permission-scoped activity returned by the backend. Hidden matters are not inferred.",
  empty: "No visible activity yet.",
  error: "Activity unavailable",
  errorMessage: "The activity list could not be loaded.",
  filters: "Activity filters",
  loading: "Loading activity",
  loadingTimeline: "Loading timeline",
  matter: "Matter ID",
  notVisible: "Activity is not visible.",
  timelineError: "Timeline unavailable",
  timelineErrorMessage: "The timeline could not be loaded.",
  pageStatus: "{{count}} visible activity events",
  retry: "Try again in {{seconds}} seconds.",
  targetType: "Target type",
  title: "Activity",
};

const persian: typeof english = {
  action: "اقدام",
  actor: "شناسه عضویت اجراکننده",
  allActions: "همه اقدامات",
  apply: "اعمال فیلترها",
  eyebrow: "ردپای حسابرسی",
  createdAfter: "ایجاد شده بعد از",
  createdBefore: "ایجاد شده قبل از",
  description:
    "فعالیت‌های مجاز بازگردانده‌شده از سرور را بررسی کنید. رکوردهای پنهان حدس زده نمی‌شوند.",
  empty: "هنوز فعالیت قابل مشاهده‌ای وجود ندارد.",
  error: "فعالیت در دسترس نیست",
  errorMessage: "فهرست فعالیت‌ها بارگذاری نشد.",
  filters: "فیلترهای فعالیت",
  loading: "در حال بارگذاری فعالیت‌ها",
  loadingTimeline: "در حال بارگذاری خط زمانی",
  matter: "شناسه رکورد",
  notVisible: "فعالیت قابل مشاهده نیست.",
  timelineError: "خط زمانی در دسترس نیست",
  timelineErrorMessage: "خط زمانی بارگذاری نشد.",
  pageStatus: "{{count}} رویداد فعالیت قابل مشاهده",
  retry: "{{seconds}} ثانیه دیگر تلاش کنید.",
  targetType: "نوع هدف",
  title: "فعالیت",
};

export function activityText(locale: SupportedLocale) {
  return locale === "fa" ? persian : english;
}
