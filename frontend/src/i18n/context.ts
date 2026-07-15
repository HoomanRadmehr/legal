import { createContext, useContext } from "react";

import {
  type I18nInstance,
  type SupportedLocale,
  type TextDirection,
  createI18nInstance,
  defaultLocale,
  getAcceptLanguageHeader,
  getTextDirection,
  translate,
} from "./config";

export type TranslationValues = Record<string, string | number>;
export type LocaleChangeOptions = { persist?: boolean };

export type I18nContextValue = {
  acceptLanguage: string;
  changeLocale: (
    locale: SupportedLocale,
    options?: LocaleChangeOptions,
  ) => void;
  direction: TextDirection;
  i18n: I18nInstance;
  locale: SupportedLocale;
  t: (key: string, values?: TranslationValues) => string;
};

const defaultI18n = createI18nInstance(defaultLocale);

export const I18nContext = createContext<I18nContextValue>({
  acceptLanguage: getAcceptLanguageHeader(defaultLocale),
  changeLocale: () => undefined,
  direction: getTextDirection(defaultLocale),
  i18n: defaultI18n,
  locale: defaultLocale,
  t: (key, values) => translate(defaultI18n.t, key, values),
});

export function useI18n() {
  return useContext(I18nContext);
}
