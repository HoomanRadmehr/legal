export const commonResources = {
  en: {
    common: {
      actions: {
        cancel: "Cancel",
        close: "Close",
        confirm: "Confirm",
      },
      components: {
        formErrorSummary: {
          title: "Please fix the following fields",
        },
        paginatedTable: {
          empty: "No records to show.",
          pageStatus: "Page {{page}} of {{pageCount}}",
        },
      },
      locale: {
        en: "English",
        fa: "Persian",
      },
      missingKey: "Missing translation: {{key}}",
      status: {
        danger: "Needs attention",
        neutral: "Status",
        success: "Complete",
        warning: "In progress",
      },
    },
  },
  fa: {
    common: {
      actions: {
        cancel: "انصراف",
        close: "بستن",
        confirm: "تایید",
      },
      components: {
        formErrorSummary: {
          title: "لطفا این فیلدها را اصلاح کنید",
        },
        paginatedTable: {
          empty: "رکوردی برای نمایش وجود ندارد.",
          pageStatus: "صفحه {{page}} از {{pageCount}}",
        },
      },
      locale: {
        en: "انگلیسی",
        fa: "فارسی",
      },
      missingKey: "ترجمه یافت نشد: {{key}}",
      status: {
        danger: "نیازمند توجه",
        neutral: "وضعیت",
        success: "کامل",
        warning: "در حال انجام",
      },
    },
  },
} as const;
