import { createContext, useContext } from "react";

export type TextDirection = "ltr" | "rtl";

export type LocalizationState = {
  locale: "fa";
  direction: TextDirection;
};

export const defaultLocalizationState: LocalizationState = {
  locale: "fa",
  direction: "rtl",
};

export const LocalizationContext = createContext<LocalizationState>(
  defaultLocalizationState,
);

export function useLocalization(): LocalizationState {
  return useContext(LocalizationContext);
}
