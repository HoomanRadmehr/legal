import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { configureApiClientLocale } from "../api/client";
import {
  type SupportedLocale,
  createI18nInstance,
  getAcceptLanguageHeader,
  getTextDirection,
  resolveInitialLocale,
  setDocumentLocale,
  setStoredLocale,
  translate,
} from "./config";
import { I18nContext } from "./context";

export function I18nProvider({
  children,
  initialLocale,
}: PropsWithChildren<{ initialLocale?: SupportedLocale }>) {
  const [startingLocale] = useState(() => resolveInitialLocale(initialLocale));
  const [i18n] = useState(() => createI18nInstance(startingLocale));
  const [locale, setLocale] = useState<SupportedLocale>(startingLocale);
  const direction = getTextDirection(locale);
  const acceptLanguage = getAcceptLanguageHeader(locale);

  useEffect(() => {
    setDocumentLocale(locale);
    configureApiClientLocale({ getAcceptLanguage: () => acceptLanguage });
  }, [acceptLanguage, locale]);

  const changeLocale = useCallback(
    (
      nextLocale: SupportedLocale,
      options: { persist?: boolean } = { persist: true },
    ) => {
      void i18n.changeLanguage(nextLocale);
      setLocale(nextLocale);
      if (options.persist !== false) {
        setStoredLocale(nextLocale);
      }
    },
    [i18n],
  );

  const value = useMemo(
    () => ({
      acceptLanguage,
      changeLocale,
      direction,
      i18n,
      locale,
      t: (key: string, values?: Record<string, string | number>) =>
        translate(i18n.t, key, values),
    }),
    [acceptLanguage, changeLocale, direction, i18n, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
