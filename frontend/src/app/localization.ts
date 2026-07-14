import { createContext, useContext } from "react";

export type TextDirection = "ltr" | "rtl";

export type LocalizationState = {
  locale: "en";
  direction: TextDirection;
};

export const defaultLocalizationState: LocalizationState = {
  locale: "en",
  direction: "ltr",
};

export const LocalizationContext = createContext<LocalizationState>(
  defaultLocalizationState,
);

export function useLocalization(): LocalizationState {
  return useContext(LocalizationContext);
}
