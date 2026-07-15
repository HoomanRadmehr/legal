import type { SupportedLocale } from "../../../i18n";
import { formatDateTime as formatLocalizedDateTime } from "../../../i18n/date";
import type {
  NoticePriority,
  NoticeResponseStatus,
  NoticeStatus,
} from "../types";

const noticeCopy = {
  en: {
    actionFailed: "The action failed.",
    active: "Active",
    activeOnly: "Active only",
    allNotices: "All notices",
    any: "Any",
    anyResponse: "Any response",
    anyStatus: "Any status",
    applyFilters: "Apply filters",
    archive: "Archive notice",
    archiveBody:
      "Archive keeps the notice and linked records available for permitted users. It is not a delete.",
    archivedAt: "Archived at",
    archivedOnly: "Archived only",
    archiveState: "Archive state",
    backToDetail: "Back to detail",
    backToNotices: "Back to notices",
    caption: "Legal notices",
    closedOn: "Closed on",
    create: "Create notice",
    createDescription: "Record intake and create the linked response deadline.",
    dates: "Dates",
    description: "Description",
    detail: "Notice detail",
    details: "Notice details",
    edit: "Edit notice",
    empty: "No notices match the current filters.",
    error: "Notice unavailable",
    eyebrow: "Legal notices",
    filters: "Notice filters",
    hiddenSelected:
      "Some selected matters are not in the current search results.",
    invalidValue: "Invalid value.",
    linkedDeadline: "Linked deadline",
    linkedDeadlineAssignee: "Linked deadline assignee",
    linkedDeadlineStatus: "Linked deadline status",
    linkedRecords: "Linked records",
    listDescription:
      "Track notice intake, response dates, and linked deadline status.",
    listTitle: "Notices",
    loading: "Loading notice",
    loadingList: "Loading notices",
    loadingRelatedMatters: "Loading related matters",
    noDescription: "No description provided.",
    noMatches: "No visible cases or contracts match this search.",
    none: "None",
    notFound: "Notice not found",
    notFoundMessage: "The notice could not be found.",
    openedOn: "Opened on",
    ordering: "Ordering",
    overdueOnly: "Overdue only",
    overdueResponse: "Overdue response",
    overview: "Notice overview",
    ownerMembership: "Owner membership",
    permissionHelp:
      "Only matters returned by permission-scoped case and contract searches can be selected.",
    priority: "Priority",
    receivedAfter: "Received after",
    receivedBefore: "Received before",
    receivedDate: "Received date",
    reference: "Reference",
    referenceCode: "Reference code",
    relatedMatterNotFound: "A related matter was not found or is not visible.",
    relatedMatters: "Related matters",
    relatedNotVisible: "Related matters are not visible.",
    relatedUnavailable: "Related matters unavailable",
    removeRelatedMatter: "Remove related matter",
    response: "Response",
    responseDateInvalid: "Response deadline cannot precede received date.",
    responseDates: "Response dates",
    responseDeadline: "Response deadline",
    responseDeadlineHelp:
      "Changing the response deadline updates the linked deadline after save.",
    responseStatus: "Response status",
    save: "Save changes",
    saveFailed: "Save failed.",
    search: "Search",
    searchRelated: "Search visible cases and contracts",
    searchRelatedAria: "Search visible related matters",
    selectedRelatedMatters: "Selected related matters",
    sender: "Sender",
    status: "Status",
    timeline: "Timeline",
    timelineAria: "Notice timeline",
    timelineEmpty: "No timeline events yet.",
    title: "Title",
    unavailable: "Notices unavailable",
    unavailableValue: "Unavailable",
    versionConflict:
      "This notice changed while you were editing. Reload before saving to avoid overwriting work.",
    viewerReadonly: "Viewer access is read-only.",
    visibleCases: "Visible cases",
    visibleContracts: "Visible contracts",
    options: {
      newestReceived: "Newest received",
      recentlyUpdated: "Recently updated",
      reference: "Reference A-Z",
      responseDueSoonest: "Response due soonest",
    },
  },
  fa: {
    actionFailed: "اقدام ناموفق بود.",
    active: "فعال",
    activeOnly: "فقط فعال",
    allNotices: "همه ابلاغ‌ها",
    any: "همه",
    anyResponse: "هر پاسخ",
    anyStatus: "هر وضعیت",
    applyFilters: "اعمال فیلترها",
    archive: "بایگانی ابلاغ",
    archiveBody:
      "بایگانی، ابلاغ و رکوردهای مرتبط را برای کاربران مجاز در دسترس نگه می‌دارد و حذف نیست.",
    archivedAt: "بایگانی شده در",
    archivedOnly: "فقط بایگانی‌شده",
    archiveState: "وضعیت بایگانی",
    backToDetail: "بازگشت به جزئیات",
    backToNotices: "بازگشت به ابلاغ‌ها",
    caption: "ابلاغ‌های حقوقی",
    closedOn: "بسته‌شده در",
    create: "ایجاد ابلاغ",
    createDescription: "دریافت ابلاغ را ثبت کنید و مهلت پاسخ مرتبط را بسازید.",
    dates: "تاریخ‌ها",
    description: "شرح",
    detail: "جزئیات ابلاغ",
    details: "جزئیات ابلاغ",
    edit: "ویرایش ابلاغ",
    empty: "هیچ ابلاغی با فیلترهای فعلی پیدا نشد.",
    error: "ابلاغ در دسترس نیست",
    eyebrow: "ابلاغ‌های حقوقی",
    filters: "فیلترهای ابلاغ",
    hiddenSelected: "برخی رکوردهای انتخاب‌شده در نتایج جست‌وجوی فعلی نیستند.",
    invalidValue: "مقدار نامعتبر است.",
    linkedDeadline: "مهلت مرتبط",
    linkedDeadlineAssignee: "مسئول مهلت مرتبط",
    linkedDeadlineStatus: "وضعیت مهلت مرتبط",
    linkedRecords: "رکوردهای مرتبط",
    listDescription:
      "دریافت ابلاغ، تاریخ پاسخ و وضعیت مهلت مرتبط را پیگیری کنید.",
    listTitle: "ابلاغ‌ها",
    loading: "در حال بارگذاری ابلاغ",
    loadingList: "در حال بارگذاری ابلاغ‌ها",
    loadingRelatedMatters: "در حال بارگذاری رکوردهای مرتبط",
    noDescription: "شرحی ثبت نشده است.",
    noMatches: "هیچ پرونده یا قراردادی با این جست‌وجو دیده نمی‌شود.",
    none: "هیچ‌کدام",
    notFound: "ابلاغ پیدا نشد",
    notFoundMessage: "ابلاغ پیدا نشد.",
    openedOn: "باز شده در",
    ordering: "مرتب‌سازی",
    overdueOnly: "فقط دیرکرد پاسخ",
    overdueResponse: "دیرکرد پاسخ",
    overview: "نمای کلی ابلاغ",
    ownerMembership: "عضویت مالک",
    permissionHelp:
      "فقط رکوردهایی که از جست‌وجوی پرونده و قرارداد با محدوده مجوز برگردند قابل انتخاب هستند.",
    priority: "اولویت",
    receivedAfter: "دریافت بعد از",
    receivedBefore: "دریافت قبل از",
    receivedDate: "تاریخ دریافت",
    reference: "ارجاع",
    referenceCode: "کد ارجاع",
    relatedMatterNotFound: "رکورد مرتبط پیدا نشد یا قابل مشاهده نیست.",
    relatedMatters: "رکوردهای مرتبط",
    relatedNotVisible: "رکوردهای مرتبط قابل مشاهده نیستند.",
    relatedUnavailable: "رکوردهای مرتبط در دسترس نیستند",
    removeRelatedMatter: "حذف رکورد مرتبط",
    response: "پاسخ",
    responseDateInvalid: "مهلت پاسخ نمی‌تواند قبل از تاریخ دریافت باشد.",
    responseDates: "تاریخ‌های پاسخ",
    responseDeadline: "مهلت پاسخ",
    responseDeadlineHelp:
      "تغییر مهلت پاسخ، پس از ذخیره، مهلت مرتبط را به‌روزرسانی می‌کند.",
    responseStatus: "وضعیت پاسخ",
    save: "ذخیره تغییرات",
    saveFailed: "ذخیره ناموفق بود.",
    search: "جست‌وجو",
    searchRelated: "جست‌وجوی پرونده‌ها و قراردادهای قابل مشاهده",
    searchRelatedAria: "جست‌وجوی رکوردهای مرتبط قابل مشاهده",
    selectedRelatedMatters: "رکوردهای مرتبط انتخاب‌شده",
    sender: "فرستنده",
    status: "وضعیت",
    timeline: "خط زمانی",
    timelineAria: "خط زمانی ابلاغ",
    timelineEmpty: "هنوز رویدادی در خط زمانی نیست.",
    title: "عنوان",
    unavailable: "ابلاغ‌ها در دسترس نیستند",
    unavailableValue: "در دسترس نیست",
    versionConflict:
      "این ابلاغ هنگام ویرایش شما تغییر کرده است. پیش از ذخیره، صفحه را تازه‌سازی کنید تا کار دیگران بازنویسی نشود.",
    viewerReadonly: "دسترسی مشاهده‌گر فقط خواندنی است.",
    visibleCases: "پرونده‌های قابل مشاهده",
    visibleContracts: "قراردادهای قابل مشاهده",
    options: {
      newestReceived: "جدیدترین دریافت",
      recentlyUpdated: "تازه‌ترین به‌روزرسانی",
      reference: "ارجاع الف تا ی",
      responseDueSoonest: "نزدیک‌ترین مهلت پاسخ",
    },
  },
};

export function noticeText(locale: SupportedLocale) {
  return noticeCopy[locale];
}

export function noticeStatusLabel(
  status: NoticeStatus,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<NoticeStatus, string>> = {
    en: {
      archived: "Archived",
      closed: "Closed",
      received: "Received",
      responded: "Responded",
      response_due: "Response due",
      under_review: "Under review",
    },
    fa: {
      archived: "بایگانی‌شده",
      closed: "بسته",
      received: "دریافت‌شده",
      responded: "پاسخ‌داده‌شده",
      response_due: "در انتظار پاسخ",
      under_review: "در حال بررسی",
    },
  };
  return labels[locale][status] ?? labels.en[status] ?? "Unknown status";
}

export function noticeResponseStatusLabel(
  status: NoticeResponseStatus,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<
    SupportedLocale,
    Record<NoticeResponseStatus, string>
  > = {
    en: {
      cancelled: "Cancelled",
      pending: "Pending",
      responded: "Responded",
    },
    fa: {
      cancelled: "لغوشده",
      pending: "در انتظار",
      responded: "پاسخ‌داده‌شده",
    },
  };
  return (
    labels[locale][status] ?? labels.en[status] ?? "Unknown response status"
  );
}

export function noticePriorityLabel(
  priority: NoticePriority,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<NoticePriority, string>> = {
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

export function statusTone(status: NoticeStatus) {
  if (status === "archived" || status === "closed") {
    return "neutral";
  }
  if (status === "responded") {
    return "success";
  }
  return "warning";
}

export function responseTone(status: NoticeResponseStatus) {
  if (status === "responded") {
    return "success";
  }
  if (status === "cancelled") {
    return "neutral";
  }
  return "warning";
}

export function timelineActionLabel(
  action: string,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<string, string>> = {
    en: {
      "matter.archived": "Notice archived",
      "notice.created": "Notice created",
      "notice.response_deadline_changed": "Response deadline changed",
      "notice.updated": "Notice updated",
    },
    fa: {
      "matter.archived": "ابلاغ بایگانی شد",
      "notice.created": "ابلاغ ایجاد شد",
      "notice.response_deadline_changed": "مهلت پاسخ تغییر کرد",
      "notice.updated": "ابلاغ به‌روزرسانی شد",
    },
  };
  return (
    labels[locale][action] ??
    labels.en[action] ??
    fallbackNoticeActivity(locale)
  );
}

export function formatDateTime(
  value: string | null | undefined,
  locale: SupportedLocale = "en",
): string {
  return formatLocalizedDateTime(value, locale);
}

function fallbackNoticeActivity(locale: SupportedLocale): string {
  return locale === "fa" ? "فعالیت ابلاغ" : "Notice activity";
}
