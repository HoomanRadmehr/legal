import type { SupportedLocale } from "../../i18n";
import type { TimelineContext } from "./types";

const actionLabels = {
  en: {
    "case.created": "Case created",
    "case.updated": "Case updated",
    "contract.created": "Contract created",
    "contract.updated": "Contract updated",
    "deadline.completed": "Deadline completed",
    "deadline.created": "Deadline created",
    "document.available": "Document available",
    "document.download_requested": "Document download requested",
    "document.upload_completed": "Document upload completed",
    "document.upload_initiated": "Document upload initiated",
    "matter.access_granted": "Matter access granted",
    "matter.access_revoked": "Matter access revoked",
    "matter.archived": "Matter archived",
    "matter.owner_changed": "Owner changed",
    "notice.created": "Notice created",
    "notice.response_deadline_changed": "Response deadline changed",
    "notice.updated": "Notice updated",
    "task.completed": "Task completed",
    "task.created": "Task created",
  },
  fa: {
    "case.created": "پرونده ایجاد شد",
    "case.updated": "پرونده به‌روزرسانی شد",
    "contract.created": "قرارداد ایجاد شد",
    "contract.updated": "قرارداد به‌روزرسانی شد",
    "deadline.completed": "مهلت تکمیل شد",
    "deadline.created": "مهلت ایجاد شد",
    "document.available": "سند آماده شد",
    "document.download_requested": "درخواست دانلود سند ثبت شد",
    "document.upload_completed": "بارگذاری سند تکمیل شد",
    "document.upload_initiated": "بارگذاری سند آغاز شد",
    "matter.access_granted": "دسترسی رکورد اعطا شد",
    "matter.access_revoked": "دسترسی رکورد لغو شد",
    "matter.archived": "رکورد بایگانی شد",
    "matter.owner_changed": "مالک تغییر کرد",
    "notice.created": "ابلاغ ایجاد شد",
    "notice.response_deadline_changed": "مهلت پاسخ تغییر کرد",
    "notice.updated": "ابلاغ به‌روزرسانی شد",
    "task.completed": "وظیفه تکمیل شد",
    "task.created": "وظیفه ایجاد شد",
  },
} as const;

const contextFallbacks = {
  activity: { en: "Activity event", fa: "رویداد فعالیت" },
  case: { en: "Case activity", fa: "فعالیت پرونده" },
  contract: { en: "Contract activity", fa: "فعالیت قرارداد" },
  notice: { en: "Notice activity", fa: "فعالیت ابلاغ" },
} as const;

const contextActionLabels = {
  case: {
    en: { "matter.archived": "Case archived" },
    fa: { "matter.archived": "پرونده بایگانی شد" },
  },
  contract: {
    en: { "matter.archived": "Contract archived" },
    fa: { "matter.archived": "قرارداد بایگانی شد" },
  },
  notice: {
    en: { "matter.archived": "Notice archived" },
    fa: { "matter.archived": "ابلاغ بایگانی شد" },
  },
} as const;

const fieldLabels = {
  en: {
    assignee_id: "Assignee",
    due_at: "Due date",
    expiration_date: "Expiration date",
    owner_id: "Owner",
    priority: "Priority",
    reference_code: "Reference",
    renewal_date: "Renewal date",
    response_deadline: "Response deadline",
    response_status: "Response status",
    status: "Status",
    title: "Title",
  },
  fa: {
    assignee_id: "مسئول",
    due_at: "تاریخ سررسید",
    expiration_date: "تاریخ انقضا",
    owner_id: "مالک",
    priority: "اولویت",
    reference_code: "شناسه",
    renewal_date: "تاریخ تمدید",
    response_deadline: "مهلت پاسخ",
    response_status: "وضعیت پاسخ",
    status: "وضعیت",
    title: "عنوان",
  },
} as const;

type ReviewedField = keyof typeof fieldLabels.en;

export function activityActionLabel({
  action,
  context,
  locale,
}: {
  action: string;
  context: TimelineContext;
  locale: SupportedLocale;
}): string {
  const contextLabel = contextSpecificActionLabel({ action, context, locale });
  if (contextLabel) {
    return contextLabel;
  }
  return (
    actionLabels[locale][action as keyof typeof actionLabels.en] ??
    contextFallbacks[context][locale]
  );
}

function contextSpecificActionLabel({
  action,
  context,
  locale,
}: {
  action: string;
  context: TimelineContext;
  locale: SupportedLocale;
}): string | null {
  if (context === "activity") {
    return null;
  }
  return (
    contextActionLabels[context][locale][
      action as keyof (typeof contextActionLabels)[typeof context]["en"]
    ] ?? null
  );
}

export function reviewedFieldLabel(
  field: string,
  locale: SupportedLocale,
): string | null {
  if (field in fieldLabels.en) {
    return fieldLabels[locale][field as ReviewedField];
  }
  return null;
}
