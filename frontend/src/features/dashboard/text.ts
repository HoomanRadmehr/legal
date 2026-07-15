import type { SupportedLocale } from "../../i18n";
import type { DashboardRole } from "./types";

export type DashboardText = ReturnType<typeof dashboardText>;

const english = {
  activity: "Recent activity",
  activityEmpty: "No visible activity yet.",
  activityLink: "Open activity",
  cases: "Cases",
  contracts: "Contracts",
  deadlines: "Deadlines",
  description:
    "A permission-aware summary from records the backend says you can see.",
  empty: "No urgent workload is visible right now.",
  error: "Dashboard unavailable",
  errorMessage: "The dashboard could not be loaded.",
  eyebrow: "Legal workspace",
  loading: "Loading dashboard",
  notices: "Notices",
  retry: "Try again in {{seconds}} seconds.",
  roleDescriptions: {
    admin: "Organization workload you are allowed to manage.",
    counsel: "Your owned and shared legal work.",
    viewer: "Read-only workload from records you can view.",
  },
  tasks: "Tasks",
  title: "Dashboard",
  urgent: "Urgent",
  values: {
    assignedDeadlines: "Assigned to me",
    assignedTasks: "Assigned to me",
    expiringContracts: "Expiration or renewal soon",
    highCases: "High or critical priority",
    openCases: "Open visible cases",
    openNotices: "Open notices",
    overdueDeadlines: "Overdue",
    overdueNotices: "Response overdue",
    overdueTasks: "Overdue assigned tasks",
    todayDeadlines: "Due today",
    totalCases: "Visible cases",
    totalContracts: "Visible contracts",
    upcomingDeadlines: "Upcoming",
  },
};

const persian: typeof english = {
  activity: "فعالیت‌های اخیر",
  activityEmpty: "هنوز فعالیت قابل مشاهده‌ای وجود ندارد.",
  activityLink: "باز کردن فعالیت",
  cases: "پرونده‌ها",
  contracts: "قراردادها",
  deadlines: "مهلت‌ها",
  description:
    "خلاصه‌ای مبتنی بر مجوز از رکوردهایی که سرور اجازه مشاهده آن‌ها را داده است.",
  empty: "در حال حاضر کار فوری قابل مشاهده‌ای وجود ندارد.",
  error: "داشبورد در دسترس نیست",
  errorMessage: "داشبورد بارگذاری نشد.",
  eyebrow: "فضای کاری حقوقی",
  loading: "در حال بارگذاری داشبورد",
  notices: "ابلاغ‌ها",
  retry: "{{seconds}} ثانیه دیگر تلاش کنید.",
  roleDescriptions: {
    admin: "حجم کاری سازمان که مجاز به مدیریت آن هستید.",
    counsel: "کارهای حقوقی متعلق به شما یا به‌اشتراک‌گذاشته‌شده با شما.",
    viewer: "حجم کاری فقط‌خواندنی از رکوردهایی که می‌توانید ببینید.",
  },
  tasks: "وظایف",
  title: "داشبورد",
  urgent: "فوری",
  values: {
    assignedDeadlines: "واگذار شده به من",
    assignedTasks: "واگذار شده به من",
    expiringContracts: "انقضا یا تمدید نزدیک",
    highCases: "اولویت بالا یا بحرانی",
    openCases: "پرونده‌های باز قابل مشاهده",
    openNotices: "ابلاغ‌های باز",
    overdueDeadlines: "گذشته از موعد",
    overdueNotices: "پاسخ گذشته از موعد",
    overdueTasks: "وظایف واگذار شده گذشته از موعد",
    todayDeadlines: "سررسید امروز",
    totalCases: "پرونده‌های قابل مشاهده",
    totalContracts: "قراردادهای قابل مشاهده",
    upcomingDeadlines: "پیش رو",
  },
};

export function dashboardText(locale: SupportedLocale) {
  return locale === "fa" ? persian : english;
}

export function dashboardRoleDescription(
  role: DashboardRole,
  text: DashboardText,
): string {
  if (role === "legal_admin" || role === "legal_manager") {
    return text.roleDescriptions.admin;
  }
  if (role === "legal_counsel") {
    return text.roleDescriptions.counsel;
  }
  return text.roleDescriptions.viewer;
}
