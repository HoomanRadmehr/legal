import type { SupportedLocale } from "../../i18n";

const english = {
  accessGrants: "Access grants to revoke",
  active: "Active",
  completed:
    "Offboarding completed. The departing membership is now offboarded.",
  confirmHelp: "Type OFFBOARD to execute this transfer.",
  confirmation: "Confirmation",
  deadlineCount: "{{count}} open deadlines",
  deadlines: "Open deadlines to reassign",
  departing: "Departing member",
  description:
    "Preview the exact work that will transfer before executing the atomic offboarding.",
  emptyAccess: "No active access grants.",
  emptyDeadlines: "No open deadlines.",
  emptyMatters: "No active owned matters.",
  emptyTasks: "No open tasks.",
  error: "Offboarding unavailable",
  execute: "Execute offboarding",
  executeFailed: "Offboarding could not be executed.",
  executing: "Executing offboarding",
  forbidden: "This administrative page is not available for your role.",
  loadMembers: "Loading organization members",
  matterCount: "{{count}} active owned matters",
  matters: "Owned active matters",
  membersFailed: "Organization members could not be loaded.",
  noPreview: "Request a preview before executing.",
  preview: "Preview offboarding",
  previewFailed: "The offboarding preview could not be created.",
  previewReady: "Preview ready. No changes have been made yet.",
  replacement: "Replacement member",
  retry: "Try again in {{seconds}} seconds.",
  runId: "Run ID",
  sameMember: "Choose two different active memberships.",
  selectDeparting: "Select departing member",
  selectReplacement: "Select replacement member",
  stale:
    "This preview is stale. Review a fresh preview before executing again.",
  status: "Status",
  taskCount: "{{count}} open tasks",
  tasks: "Open tasks to reassign",
  title: "Offboarding",
  warnings: "Warnings",
};

const persian: typeof english = {
  accessGrants: "دسترسی‌هایی که لغو می‌شوند",
  active: "فعال",
  completed: "خروج کاربر تکمیل شد. عضویت خروجی اکنون غیرفعال است.",
  confirmHelp: "برای اجرای انتقال، OFFBOARD را وارد کنید.",
  confirmation: "تایید",
  deadlineCount: "{{count}} مهلت باز",
  deadlines: "مهلت‌های باز برای انتقال",
  departing: "عضو خروجی",
  description:
    "پیش از اجرای اتمیک خروج کاربر، کارهای قابل انتقال را دقیق بررسی کنید.",
  emptyAccess: "دسترسی فعالی وجود ندارد.",
  emptyDeadlines: "مهلت بازی وجود ندارد.",
  emptyMatters: "پرونده فعال تحت مالکیت وجود ندارد.",
  emptyTasks: "تکلیف بازی وجود ندارد.",
  error: "خروج کاربر در دسترس نیست",
  execute: "اجرای خروج کاربر",
  executeFailed: "خروج کاربر اجرا نشد.",
  executing: "در حال اجرای خروج کاربر",
  forbidden: "این صفحه مدیریتی برای نقش شما در دسترس نیست.",
  loadMembers: "در حال بارگذاری اعضای سازمان",
  matterCount: "{{count}} پرونده فعال تحت مالکیت",
  matters: "پرونده‌های فعال تحت مالکیت",
  membersFailed: "اعضای سازمان بارگذاری نشدند.",
  noPreview: "پیش از اجرا، پیش‌نمایش بگیرید.",
  preview: "پیش‌نمایش خروج کاربر",
  previewFailed: "پیش‌نمایش خروج کاربر ایجاد نشد.",
  previewReady: "پیش‌نمایش آماده است. هنوز تغییری انجام نشده است.",
  replacement: "عضو جایگزین",
  retry: "{{seconds}} ثانیه دیگر تلاش کنید.",
  runId: "شناسه اجرا",
  sameMember: "دو عضویت فعال متفاوت انتخاب کنید.",
  selectDeparting: "انتخاب عضو خروجی",
  selectReplacement: "انتخاب عضو جایگزین",
  stale: "این پیش‌نمایش قدیمی است. پیش از اجرای دوباره، پیش‌نمایش تازه بگیرید.",
  status: "وضعیت",
  taskCount: "{{count}} تکلیف باز",
  tasks: "تکلیف‌های باز برای انتقال",
  title: "خروج کاربر",
  warnings: "هشدارها",
};

export function offboardingText(locale: SupportedLocale) {
  return locale === "fa" ? persian : english;
}

export function fillCount(label: string, count: number): string {
  return label.replace("{{count}}", String(count));
}
