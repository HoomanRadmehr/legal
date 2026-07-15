import type { SupportedLocale } from "../../../i18n";
import type {
  ContractDetail,
  ContractListItem,
  ContractPriority,
  ContractStatus,
  ContractType,
} from "../types";

const contractCopy = {
  en: {
    activeOnly: "Active only",
    applyFilters: "Apply filters",
    archive: "Archive contract",
    archiveAll: "All contracts",
    archiveBody:
      "Archive keeps the contract and timeline available for permitted users. It is not a delete.",
    archiveOnly: "Archived only",
    archiveState: "Archive state",
    backToContracts: "Back to contracts",
    backToDetail: "Back to detail",
    closed: "Closed",
    closedOn: "Closed on",
    contractDetails: "Contract details",
    contractType: "Contract type",
    counterparty: "Counterparty",
    create: "Create contract",
    createDescription:
      "Create a matter-linked contract with explicit renewal and expiration dates.",
    dates: "Dates",
    dateState: "Date state",
    description: "Description",
    detail: "Contract detail",
    effective: "Effective",
    effectiveAfter: "Effective after",
    effectiveBefore: "Effective before",
    effectiveDate: "Effective date",
    edit: "Edit contract",
    error: "Contract unavailable",
    expiration: "Expiration",
    expirationAfter: "Expiration after",
    expirationBefore: "Expiration before",
    expirationDate: "Expiration date",
    eyebrow: "Contracts",
    filters: "Contract filters",
    keyTerms: "Key terms",
    keyTermsJson: "Key terms JSON",
    linked: "Linked work",
    linkedPlaceholder:
      "Deadlines, tasks, and documents will appear here as their screens are added.",
    listDescription:
      "Review contract status, counterparties, renewal dates, and expiration risk.",
    listTitle: "Contracts",
    loading: "Loading contract",
    loadingList: "Loading contracts",
    noDescription: "No description provided.",
    noKeyTerms: "No key terms recorded.",
    notFound: "Contract not found",
    notFoundMessage: "The contract could not be found.",
    opened: "Opened",
    openedOn: "Opened on",
    ordering: "Ordering",
    owner: "Owner",
    ownerId: "Owner ID",
    ownerMembership: "Owner membership ID",
    priority: "Priority",
    reference: "Reference",
    referenceCode: "Reference code",
    renewal: "Renewal",
    renewalAfter: "Renewal after",
    renewalBefore: "Renewal before",
    renewalDate: "Renewal date",
    reviewTimeline: "Review timeline",
    save: "Save changes",
    search: "Search",
    status: "Status",
    summary: "Summary",
    tableEmpty: "No contracts match the current filters.",
    timeline: "Timeline",
    timelineAria: "Contract timeline",
    timelineEmpty: "No timeline events yet.",
    title: "Title",
    type: "Type",
    viewerReadonly: "Viewer access is read-only.",
    versionConflict:
      "This contract changed while you were editing. Reload before saving to avoid overwriting work.",
    saveFailed: "Save failed.",
    invalidValue: "Invalid value.",
    lifecycle: {
      expired: "Expired contract",
      expiration: "Expiration date within 30 days",
      none: "No date warning",
      renewal: "Renewal date within 30 days",
    },
    options: {
      anyPriority: "Any priority",
      anyStatus: "Any status",
      anyType: "Any type",
      effective: "Effective soonest",
      expiration: "Expiration soonest",
      newest: "Newest created",
      reference: "Reference A-Z",
      renewal: "Renewal soonest",
    },
  },
  fa: {
    activeOnly: "فقط فعال‌ها",
    applyFilters: "اعمال فیلترها",
    archive: "بایگانی قرارداد",
    archiveAll: "همه قراردادها",
    archiveBody:
      "بایگانی، قرارداد و خط زمانی را برای کاربران مجاز نگه می‌دارد و حذف نیست.",
    archiveOnly: "فقط بایگانی‌شده‌ها",
    archiveState: "وضعیت بایگانی",
    backToContracts: "بازگشت به قراردادها",
    backToDetail: "بازگشت به جزئیات",
    closed: "بسته",
    closedOn: "تاریخ بسته شدن",
    contractDetails: "جزئیات قرارداد",
    contractType: "نوع قرارداد",
    counterparty: "طرف قرارداد",
    create: "ایجاد قرارداد",
    createDescription:
      "یک قرارداد مرتبط با رکورد با تاریخ‌های تمدید و انقضای مشخص ایجاد کنید.",
    dates: "تاریخ‌ها",
    dateState: "وضعیت تاریخ",
    description: "شرح",
    detail: "جزئیات قرارداد",
    effective: "شروع",
    effectiveAfter: "شروع بعد از",
    effectiveBefore: "شروع قبل از",
    effectiveDate: "تاریخ شروع",
    edit: "ویرایش قرارداد",
    error: "قرارداد در دسترس نیست",
    expiration: "انقضا",
    expirationAfter: "انقضا بعد از",
    expirationBefore: "انقضا قبل از",
    expirationDate: "تاریخ انقضا",
    eyebrow: "قراردادها",
    filters: "فیلترهای قرارداد",
    keyTerms: "شرایط کلیدی",
    keyTermsJson: "شرایط کلیدی JSON",
    linked: "کارهای مرتبط",
    linkedPlaceholder:
      "مهلت‌ها، کارها و اسناد پس از فعال شدن بخش‌هایشان اینجا نمایش داده می‌شوند.",
    listDescription:
      "وضعیت قرارداد، طرف‌ها، تاریخ تمدید و ریسک انقضا را بررسی کنید.",
    listTitle: "قراردادها",
    loading: "در حال بارگذاری قرارداد",
    loadingList: "در حال بارگذاری قراردادها",
    noDescription: "شرحی ثبت نشده است.",
    noKeyTerms: "شرایط کلیدی ثبت نشده است.",
    notFound: "قرارداد پیدا نشد",
    notFoundMessage: "قرارداد پیدا نشد.",
    opened: "باز شده",
    openedOn: "تاریخ باز شدن",
    ordering: "مرتب‌سازی",
    owner: "مالک",
    ownerId: "شناسه مالک",
    ownerMembership: "شناسه عضویت مالک",
    priority: "اولویت",
    reference: "کد مرجع",
    referenceCode: "کد مرجع",
    renewal: "تمدید",
    renewalAfter: "تمدید بعد از",
    renewalBefore: "تمدید قبل از",
    renewalDate: "تاریخ تمدید",
    reviewTimeline: "بررسی خط زمانی",
    save: "ذخیره تغییرات",
    search: "جستجو",
    status: "وضعیت",
    summary: "خلاصه",
    tableEmpty: "هیچ قراردادی با فیلترهای فعلی پیدا نشد.",
    timeline: "خط زمانی",
    timelineAria: "خط زمانی قرارداد",
    timelineEmpty: "هنوز رویدادی در خط زمانی وجود ندارد.",
    title: "عنوان",
    type: "نوع",
    viewerReadonly: "دسترسی مشاهده‌گر فقط خواندنی است.",
    versionConflict:
      "این قرارداد هنگام ویرایش شما تغییر کرده است. پیش از ذخیره، صفحه را تازه‌سازی کنید تا کار دیگران بازنویسی نشود.",
    saveFailed: "ذخیره ناموفق بود.",
    invalidValue: "مقدار نامعتبر است.",
    lifecycle: {
      expired: "قرارداد منقضی",
      expiration: "تاریخ انقضا تا ۳۰ روز آینده",
      none: "هشدار تاریخی وجود ندارد",
      renewal: "تاریخ تمدید تا ۳۰ روز آینده",
    },
    options: {
      anyPriority: "هر اولویت",
      anyStatus: "هر وضعیت",
      anyType: "هر نوع",
      effective: "نزدیک‌ترین شروع",
      expiration: "نزدیک‌ترین انقضا",
      newest: "جدیدترین ایجاد",
      reference: "کد مرجع الفبا",
      renewal: "نزدیک‌ترین تمدید",
    },
  },
};

export function contractText(locale: SupportedLocale) {
  return contractCopy[locale];
}

export function contractStatusLabel(
  status: ContractStatus,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<ContractStatus, string>> = {
    en: {
      active: "Active",
      archived: "Archived",
      draft: "Draft",
      expired: "Expired",
      terminated: "Terminated",
    },
    fa: {
      active: "فعال",
      archived: "بایگانی‌شده",
      draft: "پیش‌نویس",
      expired: "منقضی",
      terminated: "خاتمه‌یافته",
    },
  };
  return labels[locale][status] ?? labels.en[status] ?? "Unknown status";
}

export function contractPriorityLabel(
  priority: ContractPriority,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<ContractPriority, string>> = {
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

export function contractTypeLabel(
  contractType: ContractType,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<ContractType, string>> = {
    en: {
      employment: "Employment",
      nda: "NDA",
      other: "Other",
      service: "Service",
      vendor: "Vendor",
    },
    fa: {
      employment: "استخدام",
      nda: "محرمانگی",
      other: "سایر",
      service: "خدمات",
      vendor: "تامین‌کننده",
    },
  };
  return labels[locale][contractType] ?? labels.en[contractType] ?? "Other";
}

export function statusTone(status: ContractStatus) {
  if (status === "archived" || status === "terminated") {
    return "neutral";
  }
  if (status === "draft") {
    return "warning";
  }
  if (status === "expired") {
    return "danger";
  }
  return "success";
}

export function timelineActionLabel(
  action: string,
  locale: SupportedLocale = "en",
): string {
  const labels: Record<SupportedLocale, Record<string, string>> = {
    en: {
      "contract.created": "Contract created",
      "contract.updated": "Contract updated",
      "matter.archived": "Contract archived",
      "matter.owner_changed": "Owner changed",
    },
    fa: {
      "contract.created": "قرارداد ایجاد شد",
      "contract.updated": "قرارداد به‌روزرسانی شد",
      "matter.archived": "قرارداد بایگانی شد",
      "matter.owner_changed": "مالک تغییر کرد",
    },
  };
  return (
    labels[locale][action] ??
    labels.en[action] ??
    fallbackContractActivity(locale)
  );
}

function fallbackContractActivity(locale: SupportedLocale): string {
  return locale === "fa" ? "فعالیت قرارداد" : "Contract activity";
}

export function lifecycleLabel(
  contract: ContractListItem | ContractDetail,
  locale: SupportedLocale = "en",
) {
  const labels = contractText(locale).lifecycle;
  if (contract.status === "expired") {
    return labels.expired;
  }
  if (contract.renewal_date && isWithinDays(contract.renewal_date, 30)) {
    return labels.renewal;
  }
  if (contract.expiration_date && isWithinDays(contract.expiration_date, 30)) {
    return labels.expiration;
  }
  return labels.none;
}

function isWithinDays(dateValue: string, days: number): boolean {
  const today = startOfToday();
  const target = new Date(`${dateValue}T00:00:00`);
  const milliseconds = target.getTime() - today.getTime();
  return milliseconds >= 0 && milliseconds <= days * 24 * 60 * 60 * 1000;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
