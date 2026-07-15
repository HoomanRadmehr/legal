import type { SupportedLocale } from "../../../i18n";
import type {
  CasePriority,
  CasePartyRole,
  CaseStatus,
  CaseType,
} from "../types";

const caseCopy = {
  en: {
    activeOnly: "Active only",
    addParty: "Add party",
    applyFilters: "Apply filters",
    archive: "Archive case",
    archiveAll: "All cases",
    archiveBody:
      "Archive keeps the case and timeline available for permitted users. It is not a delete.",
    archiveOnly: "Archived only",
    archiveState: "Archive state",
    backToCases: "Back to cases",
    backToDetail: "Back to detail",
    caseDetails: "Case details",
    caseType: "Case type",
    closed: "Closed",
    closedOn: "Closed on",
    contactSummary: "Contact summary",
    court: "Court or authority",
    create: "Create case",
    createDescription: "Create a matter-linked case with explicit parties.",
    dates: "Dates and authority",
    description: "Description",
    detail: "Case detail",
    edit: "Edit case",
    error: "Case unavailable",
    eyebrow: "Cases",
    filingDate: "Filing date",
    filters: "Case filters",
    linked: "Linked work",
    linkedPlaceholder:
      "Deadlines, tasks, and documents will appear here as their screens are added.",
    listDescription:
      "Review active matters, filter by case metadata, and open permitted records.",
    listTitle: "Legal cases",
    loading: "Loading case",
    loadingList: "Loading cases",
    noDescription: "No description provided.",
    noParties: "No parties recorded.",
    notFound: "Case not found",
    notFoundMessage: "The case could not be found.",
    opened: "Opened",
    openedAfter: "Opened after",
    openedBefore: "Opened before",
    openedOn: "Opened on",
    ordering: "Ordering",
    outcome: "Outcome summary",
    owner: "Owner",
    ownerId: "Owner ID",
    ownerMembership: "Owner membership ID",
    parties: "Parties",
    partyName: "Party name",
    partyRole: "Party role",
    priority: "Priority",
    reference: "Reference",
    referenceCode: "Reference code",
    removeParty: "Remove party",
    reviewTimeline: "Review timeline",
    save: "Save changes",
    search: "Search",
    status: "Status",
    summary: "Summary",
    tableEmpty: "No cases match the current filters.",
    tableTitle: "Cases",
    timeline: "Timeline",
    timelineAria: "Case timeline",
    timelineEmpty: "No timeline events yet.",
    title: "Title",
    type: "Type",
    viewerReadonly: "Viewer access is read-only.",
    versionConflict:
      "This case changed while you were editing. Reload before saving to avoid overwriting work.",
    saveFailed: "Save failed.",
    invalidValue: "Invalid value.",
    options: {
      anyPriority: "Any priority",
      anyStatus: "Any status",
      anyType: "Any type",
      newest: "Newest created",
      priority: "Priority",
      recent: "Recently updated",
      reference: "Reference A-Z",
    },
  },
  fa: {
    activeOnly: "فقط فعال‌ها",
    addParty: "افزودن طرف",
    applyFilters: "اعمال فیلترها",
    archive: "بایگانی پرونده",
    archiveAll: "همه پرونده‌ها",
    archiveBody:
      "بایگانی، پرونده و خط زمانی را برای کاربران مجاز نگه می‌دارد و حذف نیست.",
    archiveOnly: "فقط بایگانی‌شده‌ها",
    archiveState: "وضعیت بایگانی",
    backToCases: "بازگشت به پرونده‌ها",
    backToDetail: "بازگشت به جزئیات",
    caseDetails: "جزئیات پرونده",
    caseType: "نوع پرونده",
    closed: "بسته",
    closedOn: "تاریخ بسته شدن",
    contactSummary: "خلاصه تماس",
    court: "دادگاه یا مرجع",
    create: "ایجاد پرونده",
    createDescription: "یک پرونده مرتبط با رکورد و طرف‌های مشخص ایجاد کنید.",
    dates: "تاریخ‌ها و مرجع",
    description: "شرح",
    detail: "جزئیات پرونده",
    edit: "ویرایش پرونده",
    error: "پرونده در دسترس نیست",
    eyebrow: "پرونده‌ها",
    filingDate: "تاریخ ثبت",
    filters: "فیلترهای پرونده",
    linked: "کارهای مرتبط",
    linkedPlaceholder:
      "مهلت‌ها، کارها و اسناد پس از فعال شدن بخش‌هایشان اینجا نمایش داده می‌شوند.",
    listDescription:
      "رکوردهای فعال را بررسی کنید، بر اساس اطلاعات پرونده فیلتر کنید و رکوردهای مجاز را باز کنید.",
    listTitle: "پرونده‌های حقوقی",
    loading: "در حال بارگذاری پرونده",
    loadingList: "در حال بارگذاری پرونده‌ها",
    noDescription: "شرحی ثبت نشده است.",
    noParties: "طرفی ثبت نشده است.",
    notFound: "پرونده پیدا نشد",
    notFoundMessage: "پرونده پیدا نشد.",
    opened: "باز شده",
    openedAfter: "باز شده بعد از",
    openedBefore: "باز شده قبل از",
    openedOn: "تاریخ باز شدن",
    ordering: "مرتب‌سازی",
    outcome: "خلاصه نتیجه",
    owner: "مالک",
    ownerId: "شناسه مالک",
    ownerMembership: "شناسه عضویت مالک",
    parties: "طرف‌ها",
    partyName: "نام طرف",
    partyRole: "نقش طرف",
    priority: "اولویت",
    reference: "کد مرجع",
    referenceCode: "کد مرجع",
    removeParty: "حذف طرف",
    reviewTimeline: "بررسی خط زمانی",
    save: "ذخیره تغییرات",
    search: "جستجو",
    status: "وضعیت",
    summary: "خلاصه",
    tableEmpty: "هیچ پرونده‌ای با فیلترهای فعلی پیدا نشد.",
    tableTitle: "پرونده‌ها",
    timeline: "خط زمانی",
    timelineAria: "خط زمانی پرونده",
    timelineEmpty: "هنوز رویدادی در خط زمانی وجود ندارد.",
    title: "عنوان",
    type: "نوع",
    viewerReadonly: "دسترسی مشاهده‌گر فقط خواندنی است.",
    versionConflict:
      "این پرونده هنگام ویرایش شما تغییر کرده است. پیش از ذخیره، صفحه را تازه‌سازی کنید تا کار دیگران بازنویسی نشود.",
    saveFailed: "ذخیره ناموفق بود.",
    invalidValue: "مقدار نامعتبر است.",
    options: {
      anyPriority: "هر اولویت",
      anyStatus: "هر وضعیت",
      anyType: "هر نوع",
      newest: "جدیدترین ایجاد",
      priority: "اولویت",
      recent: "تازه‌ترین به‌روزرسانی",
      reference: "کد مرجع الفبا",
    },
  },
};

export function caseText(locale: SupportedLocale) {
  return caseCopy[locale];
}

export function caseStatusLabel(
  status: CaseStatus,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<CaseStatus, string>> = {
    en: {
      archived: "Archived",
      closed: "Closed",
      on_hold: "On hold",
      open: "Open",
      pending: "Pending",
    },
    fa: {
      archived: "بایگانی‌شده",
      closed: "بسته",
      on_hold: "متوقف",
      open: "باز",
      pending: "در انتظار",
    },
  };
  return labels[locale][status] ?? labels.en[status] ?? "Unknown status";
}

export function casePriorityLabel(
  priority: CasePriority,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<CasePriority, string>> = {
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

export function caseTypeLabel(
  caseType: CaseType,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<CaseType, string>> = {
    en: {
      internal: "Internal",
      litigation: "Litigation",
      other: "Other",
      regulatory: "Regulatory",
    },
    fa: {
      internal: "داخلی",
      litigation: "دادرسی",
      other: "سایر",
      regulatory: "نظارتی",
    },
  };
  return labels[locale][caseType] ?? labels.en[caseType] ?? "Other";
}

export function partyRoleLabel(
  role: CasePartyRole,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<CasePartyRole, string>> = {
    en: {
      client: "Client",
      court: "Court or authority",
      opposing: "Opposing party",
      other: "Other",
      witness: "Witness",
    },
    fa: {
      client: "موکل",
      court: "دادگاه یا مرجع",
      opposing: "طرف مقابل",
      other: "سایر",
      witness: "شاهد",
    },
  };
  return labels[locale][role] ?? labels.en[role] ?? "Other";
}

export function timelineActionLabel(
  action: string,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<string, string>> = {
    en: {
      "case.created": "Case created",
      "case.updated": "Case updated",
      "matter.archived": "Case archived",
      "matter.owner_changed": "Owner changed",
    },
    fa: {
      "case.created": "پرونده ایجاد شد",
      "case.updated": "پرونده به‌روزرسانی شد",
      "matter.archived": "پرونده بایگانی شد",
      "matter.owner_changed": "مالک تغییر کرد",
    },
  };
  return (
    labels[locale][action] ?? labels.en[action] ?? fallbackCaseActivity(locale)
  );
}

function fallbackCaseActivity(locale: SupportedLocale): string {
  return locale === "fa" ? "فعالیت پرونده" : "Case activity";
}

export function statusTone(status: CaseStatus) {
  if (status === "archived" || status === "closed") {
    return "neutral";
  }
  if (status === "on_hold" || status === "pending") {
    return "warning";
  }
  return "success";
}
