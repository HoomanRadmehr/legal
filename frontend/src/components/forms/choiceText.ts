import type { SupportedLocale } from "../../i18n";

export function choiceText(locale: SupportedLocale) {
  if (locale === "fa") {
    return {
      clearSelection: "پاک کردن انتخاب",
      failedToLoadChoices: "گزینه‌ها بارگذاری نشدند.",
      loadingMore: "در حال بارگذاری موارد بیشتر",
      noChoicesFound: "گزینه‌ای پیدا نشد.",
      retryAfter: "{{seconds}} ثانیه دیگر دوباره تلاش کنید.",
      search: "جستجو",
      searching: "در حال جستجو",
      selectAnOption: "یک گزینه را انتخاب کنید",
    };
  }

  return {
    clearSelection: "Clear selection",
    failedToLoadChoices: "Failed to load choices.",
    loadingMore: "Loading more",
    noChoicesFound: "No choices found.",
    retryAfter: "Try again in {{seconds}} seconds.",
    search: "Search",
    searching: "Searching",
    selectAnOption: "Select an option",
  };
}
