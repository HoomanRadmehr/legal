import i18next, { type TFunction, type i18n } from "i18next";

import { commonResources } from "./resources";

export type SupportedLocale = "en" | "fa";
export type TextDirection = "ltr" | "rtl";

export const defaultLocale: SupportedLocale = "en";
export const supportedLocales = ["en", "fa"] as const;

export function createI18nInstance(locale: SupportedLocale = defaultLocale) {
  const instance = i18next.createInstance();

  void instance.init({
    defaultNS: "common",
    fallbackLng: defaultLocale,
    initImmediate: false,
    interpolation: {
      escapeValue: false,
    },
    lng: locale,
    ns: ["common"],
    parseMissingKeyHandler: (key) => `Missing translation: ${key}`,
    resources: commonResources,
    returnNull: false,
    supportedLngs: supportedLocales,
  });

  return instance;
}

export function normalizeLocale(value: string | undefined): SupportedLocale {
  if (value?.toLowerCase().startsWith("fa")) {
    return "fa";
  }
  return defaultLocale;
}

export function getTextDirection(locale: SupportedLocale): TextDirection {
  return locale === "fa" ? "rtl" : "ltr";
}

export function getAcceptLanguageHeader(locale: SupportedLocale): string {
  if (locale === "fa") {
    return "fa-IR, fa;q=0.9, en;q=0.8";
  }
  return "en-US, en;q=0.9, fa;q=0.5";
}

export function translate(
  translator: TFunction<"common", undefined>,
  key: string,
  values?: Record<string, string | number>,
) {
  return translator(key, values);
}

export type I18nInstance = i18n;
