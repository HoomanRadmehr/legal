import type { SupportedLocale } from "../../i18n";

const english = {
  actions: "Actions",
  available: "Available",
  completing: "Confirming upload with server",
  download: "Download",
  downloading: "Preparing",
  dropHere: "Drop document here",
  empty: "No documents yet.",
  error: "The document request failed.",
  fileSelected: "File selected",
  initiating: "Requesting upload authorization",
  listTitle: "Documents",
  loading: "Loading documents...",
  matterDocuments: "Matter documents",
  name: "Name",
  pageDescription:
    "Review visible matter documents and request fresh download links.",
  pageEyebrow: "Document vault",
  processing:
    "Byte upload complete. Server processing remains authoritative.",
  rateLimited: "Too many uploads. Try again in {{seconds}} seconds.",
  realtimeList:
    "Realtime updates are reconnecting. Document lists will refresh after reconnect.",
  realtimeMatter:
    "Realtime updates are reconnecting. Active uploads will be checked.",
  revoke: "Revoke",
  revoking: "Revoking",
  select: "Select document",
  serverStatus: "Server status: {{status}}",
  size: "Size",
  status: "Status",
  tooLarge: "The selected file is larger than the upload limit.",
  upload: "Upload document",
  uploadDescription:
    "Files upload directly to private storage after backend authorization.",
  uploadFailed: "The upload could not be started.",
  uploadProgress: "Upload progress",
  uploading: "Uploading {{progress}}%",
  uploadType: "This file type is not allowed.",
  emptyFile: "Select a non-empty file.",
};

const persian: typeof english = {
  actions: "اقدام‌ها",
  available: "در دسترس",
  completing: "در حال تایید بارگذاری با سرور",
  download: "دانلود",
  downloading: "در حال آماده‌سازی",
  dropHere: "سند را اینجا رها کنید",
  empty: "هنوز سندی وجود ندارد.",
  error: "درخواست سند ناموفق بود.",
  fileSelected: "فایل انتخاب شد",
  initiating: "در حال دریافت مجوز بارگذاری",
  listTitle: "اسناد",
  loading: "در حال بارگذاری اسناد...",
  matterDocuments: "اسناد رکورد",
  name: "نام",
  pageDescription:
    "اسناد قابل مشاهده رکوردها را بررسی کنید و لینک دانلود تازه بگیرید.",
  pageEyebrow: "مخزن اسناد",
  processing: "بارگذاری بایت‌ها کامل شد. پردازش سرور مرجع نهایی است.",
  rateLimited: "تعداد بارگذاری‌ها بیش از حد مجاز است. {{seconds}} ثانیه دیگر تلاش کنید.",
  realtimeList:
    "به‌روزرسانی‌های لحظه‌ای در حال اتصال دوباره هستند. فهرست اسناد پس از اتصال تازه می‌شود.",
  realtimeMatter:
    "به‌روزرسانی‌های لحظه‌ای در حال اتصال دوباره هستند. بارگذاری‌های فعال بررسی می‌شوند.",
  revoke: "لغو دسترسی",
  revoking: "در حال لغو",
  select: "انتخاب سند",
  serverStatus: "وضعیت سرور: {{status}}",
  size: "اندازه",
  status: "وضعیت",
  tooLarge: "فایل انتخاب‌شده از حد مجاز بارگذاری بزرگ‌تر است.",
  upload: "بارگذاری سند",
  uploadDescription:
    "فایل‌ها پس از مجوزدهی سرور مستقیما در فضای ذخیره‌سازی خصوصی بارگذاری می‌شوند.",
  uploadFailed: "بارگذاری آغاز نشد.",
  uploadProgress: "پیشرفت بارگذاری",
  uploading: "{{progress}}٪ بارگذاری شد",
  uploadType: "این نوع فایل مجاز نیست.",
  emptyFile: "یک فایل غیرخالی انتخاب کنید.",
};

export function documentText(locale: SupportedLocale) {
  return locale === "fa" ? persian : english;
}

export function fillDocumentText(
  label: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{{${key}}}`, String(value)),
    label,
  );
}

export function documentStatusLabel(
  status: string,
  locale: SupportedLocale,
): string {
  if (status === "available") {
    return documentText(locale).available;
  }
  return status;
}
