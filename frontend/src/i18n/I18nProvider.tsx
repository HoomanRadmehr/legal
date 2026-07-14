import { type PropsWithChildren, useEffect, useMemo, useState } from "react";

import {
  type SupportedLocale,
  createI18nInstance,
  defaultLocale,
  getAcceptLanguageHeader,
  getTextDirection,
  translate,
} from "./config";
import { I18nContext } from "./context";

export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: PropsWithChildren<{ initialLocale?: SupportedLocale }>) {
  const [i18n] = useState(() => createI18nInstance(initialLocale));
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const direction = getTextDirection(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const value = useMemo(
    () => ({
      acceptLanguage: getAcceptLanguageHeader(locale),
      changeLocale: (nextLocale: SupportedLocale) => {
        void i18n.changeLanguage(nextLocale);
        setLocale(nextLocale);
      },
      direction,
      i18n,
      locale,
      t: (key: string, values?: Record<string, string | number>) =>
        translate(i18n.t, key, values),
    }),
    [direction, i18n, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
