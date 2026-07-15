import type { SupportedLocale } from "../../i18n";

const english = {
  actions: "Actions",
  available: "Available",
  backToDocuments: "Back to documents",
  cancel: "Cancel",
  cancelled: "Cancelled",
  chooseFile: "Choose file",
  clearSelection: "Clear selection",
  completing: "Confirming upload with server",
  description: "Description",
  descriptionTooLong: "Description is too long.",
  download: "Download",
  downloading: "Preparing",
  dropHere: "Drop document here",
  empty: "No documents have been uploaded.",
  failedToLoadChoices: "Failed to load choices.",
  error: "The document request failed.",
  expired: "Expired",
  failed: "Failed",
  fileName: "File name",
  fileRequired: "File is required.",
  fileSelected: "File selected",
  fileSize: "File size",
  idle: "No upload selected",
  loadingMore: "Loading more",
  matterRequired: "Legal matter is required.",
  mimeType: "MIME type",
  networkFailure:
    "Storage upload failed because the network connection was interrupted.",
  newDocument: "New document",
  newDocumentDescription:
    "Create document metadata and upload the file directly to private storage.",
  noChoices: "No choices found",
  pending_upload: "Pending upload",
  permissionDenied: "You do not have permission to upload documents.",
  preparing: "Preparing file",
  remove: "Remove",
  removeFile: "Remove file",
  requesting_presign: "Requesting upload permission",
  resolvingMatter: "Checking the requested legal matter.",
  retry: "Retry",
  listTitle: "Documents",
  loading: "Loading documents...",
  matterDocuments: "Matter documents",
  name: "Name",
  pageDescription:
    "Review visible matter documents and request fresh download links.",
  pageEyebrow: "Document vault",
  rateLimited: "Too many uploads. Try again in {{seconds}} seconds.",
  realtimeList:
    "Realtime updates are reconnecting. Document lists will refresh after reconnect.",
  realtimeMatter:
    "Realtime updates are reconnecting. Active uploads will be checked.",
  revoke: "Revoke",
  revoking: "Revoking",
  select: "Select document",
  searchLegalMatter: "Search legal matters",
  selectFile: "Select file",
  selectLegalMatter: "Select legal matter",
  serverStatus: "Server status: {{status}}",
  size: "Size",
  status: "Status",
  storageUnavailable: "Storage is temporarily unavailable. Try again shortly.",
  storageUploadFailed: "The direct storage upload failed.",
  tooLarge: "The selected file is larger than the upload limit.",
  upload: "Upload document",
  uploadAnother: "Upload another document",
  uploadAvailable: "The document is available.",
  uploadDescription:
    "Files upload directly to private storage after backend authorization.",
  uploadFailed: "The upload could not be started.",
  uploadProgress: "Upload progress",
  uploaded_to_storage: "Uploaded to storage. Waiting for backend verification.",
  uploading: "Uploading {{progress}}%",
  uploadUrlExpired:
    "The upload URL expired or was rejected. Request a new upload.",
  uploadType: "This file type is not allowed.",
  emptyFile: "Select a non-empty file.",
  searching: "Searching",
  unavailableMatter: "The requested legal matter is not available.",
  verifying: "Verifying uploaded document",
};

const persian: typeof english = {
  actions: "اقدام‌ها",
  available: "در دسترس",
  backToDocuments: "بازگشت به اسناد",
  cancel: "لغو",
  cancelled: "لغوشده",
  chooseFile: "انتخاب فایل",
  clearSelection: "پاک کردن انتخاب",
  completing: "در حال تایید بارگذاری با سرور",
  description: "توضیحات",
  descriptionTooLong: "توضیحات بیش از حد طولانی است.",
  download: "دانلود",
  downloading: "در حال آماده‌سازی",
  dropHere: "سند را اینجا رها کنید",
  empty: "هنوز سندی بارگذاری نشده است.",
  failedToLoadChoices: "دریافت گزینه‌ها ناموفق بود.",
  error: "درخواست سند ناموفق بود.",
  expired: "منقضی‌شده",
  failed: "ناموفق",
  fileName: "نام فایل",
  fileRequired: "فایل الزامی است.",
  fileSelected: "فایل انتخاب شد",
  fileSize: "اندازه فایل",
  idle: "فایلی انتخاب نشده است",
  loadingMore: "در حال بارگذاری موارد بیشتر",
  matterRequired: "رکورد حقوقی الزامی است.",
  mimeType: "نوع MIME",
  networkFailure:
    "بارگذاری در فضای ذخیره‌سازی به دلیل قطع ارتباط شبکه ناموفق بود.",
  newDocument: "سند جدید",
  newDocumentDescription:
    "فراداده سند را بسازید و فایل را مستقیما در فضای ذخیره‌سازی خصوصی بارگذاری کنید.",
  noChoices: "گزینه‌ای پیدا نشد",
  pending_upload: "در انتظار بارگذاری",
  permissionDenied: "شما مجوز بارگذاری سند را ندارید.",
  preparing: "در حال آماده‌سازی فایل",
  remove: "حذف",
  removeFile: "حذف فایل",
  requesting_presign: "در حال دریافت مجوز بارگذاری",
  resolvingMatter: "در حال بررسی رکورد حقوقی درخواست‌شده.",
  retry: "تلاش دوباره",
  listTitle: "اسناد",
  loading: "در حال بارگذاری اسناد...",
  matterDocuments: "اسناد رکورد",
  name: "نام",
  pageDescription:
    "اسناد قابل مشاهده رکوردها را بررسی کنید و لینک دانلود تازه بگیرید.",
  pageEyebrow: "مخزن اسناد",
  rateLimited:
    "تعداد بارگذاری‌ها بیش از حد مجاز است. {{seconds}} ثانیه دیگر تلاش کنید.",
  realtimeList:
    "به‌روزرسانی‌های لحظه‌ای در حال اتصال دوباره هستند. فهرست اسناد پس از اتصال تازه می‌شود.",
  realtimeMatter:
    "به‌روزرسانی‌های لحظه‌ای در حال اتصال دوباره هستند. بارگذاری‌های فعال بررسی می‌شوند.",
  revoke: "لغو دسترسی",
  revoking: "در حال لغو",
  select: "انتخاب سند",
  searchLegalMatter: "جستجوی رکوردهای حقوقی",
  selectFile: "انتخاب فایل",
  selectLegalMatter: "انتخاب رکورد حقوقی",
  serverStatus: "وضعیت سرور: {{status}}",
  size: "اندازه",
  status: "وضعیت",
  storageUnavailable:
    "فضای ذخیره‌سازی موقتا در دسترس نیست. کمی بعد دوباره تلاش کنید.",
  storageUploadFailed: "بارگذاری مستقیم در فضای ذخیره‌سازی ناموفق بود.",
  tooLarge: "فایل انتخاب‌شده از حد مجاز بارگذاری بزرگ‌تر است.",
  upload: "بارگذاری سند",
  uploadAnother: "بارگذاری سند دیگر",
  uploadAvailable: "سند در دسترس است.",
  uploadDescription:
    "فایل‌ها پس از مجوزدهی سرور مستقیما در فضای ذخیره‌سازی خصوصی بارگذاری می‌شوند.",
  uploadFailed: "بارگذاری آغاز نشد.",
  uploadProgress: "پیشرفت بارگذاری",
  uploaded_to_storage:
    "در فضای ذخیره‌سازی بارگذاری شد. منتظر تایید سرور بمانید.",
  uploading: "{{progress}}٪ بارگذاری شد",
  uploadUrlExpired:
    "نشانی بارگذاری منقضی شد یا پذیرفته نشد. بارگذاری تازه‌ای درخواست کنید.",
  uploadType: "این نوع فایل مجاز نیست.",
  emptyFile: "یک فایل غیرخالی انتخاب کنید.",
  searching: "در حال جستجو",
  unavailableMatter: "رکورد حقوقی درخواست‌شده در دسترس نیست.",
  verifying: "در حال بررسی سند بارگذاری‌شده",
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
  const labels = documentText(locale);
  return status in labels ? labels[status as keyof typeof labels] : status;
}
