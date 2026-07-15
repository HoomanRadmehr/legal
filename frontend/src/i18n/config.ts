import i18next, { type TFunction, type i18n } from "i18next";

import { commonResources } from "./resources";

export type SupportedLocale = "en" | "fa";
export type TextDirection = "ltr" | "rtl";

export const defaultLocale: SupportedLocale = "fa";
export const supportedLocales = ["fa", "en"] as const;
export const localeStorageKey = "legal.locale";

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
  return parseSupportedLocale(value) ?? defaultLocale;
}

export function parseSupportedLocale(
  value: string | null | undefined,
): SupportedLocale | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "fa" || normalized.startsWith("fa-")) {
    return "fa";
  }
  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }
  return null;
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

export function getStoredLocale(): SupportedLocale | null {
  const storedValue = window.localStorage.getItem(localeStorageKey);
  const locale = parseSupportedLocale(storedValue);
  if (storedValue && !locale) {
    window.localStorage.removeItem(localeStorageKey);
  }
  return locale;
}

export function setStoredLocale(locale: SupportedLocale): void {
  window.localStorage.setItem(localeStorageKey, locale);
}

export function resolveInitialLocale(initialLocale?: SupportedLocale): SupportedLocale {
  if (initialLocale) {
    return normalizeLocale(initialLocale);
  }
  return getStoredLocale() ?? defaultLocale;
}

export function setDocumentLocale(locale: SupportedLocale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = getTextDirection(locale);
}

export function translate(
  translator: TFunction<"common", undefined>,
  key: string,
  values?: Record<string, string | number>,
) {
  return translator(key, values);
}

export type I18nInstance = i18n;
