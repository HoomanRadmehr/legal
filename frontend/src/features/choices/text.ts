import type { SupportedLocale } from "../../i18n";

export function choiceLabels(locale: SupportedLocale) {
  if (locale === "fa") {
    return {
      assignee: "مسئول",
      involvedUsers: "کاربران مرتبط",
      owner: "مالک",
      relatedLegalMatter: "پرونده حقوقی مرتبط",
      replacementUser: "جایگزین",
      searchMembership: "جستجوی کاربر",
      searchMatter: "جستجوی پرونده",
    };
  }

  return {
    assignee: "Assignee",
    involvedUsers: "Involved users",
    owner: "Owner",
    relatedLegalMatter: "Related legal matter",
    replacementUser: "Replacement user",
    searchMembership: "Search users",
    searchMatter: "Search matters",
  };
}
