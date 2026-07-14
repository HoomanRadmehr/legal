import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";

import {
  I18nProvider,
  createI18nInstance,
  getAcceptLanguageHeader,
  getTextDirection,
  useI18n,
} from ".";
import { commonResources } from "./resources";

test("translates common namespace keys in English and Persian", () => {
  const english = createI18nInstance("en");
  const persian = createI18nInstance("fa");

  expect(english.t("actions.cancel")).toBe("Cancel");
  expect(persian.t("actions.cancel")).toBe("انصراف");
});

test("common resources have matching keys for supported locales", () => {
  const englishKeys = collectKeys(commonResources.en.common);
  const persianKeys = collectKeys(commonResources.fa.common);

  expect(persianKeys).toEqual(englishKeys);
});

test("missing keys use a visible missing translation policy", () => {
  const english = createI18nInstance("en");

  expect(english.t("not.real")).toBe("Missing translation: not.real");
});

test("provider switches document language and direction", async () => {
  const user = userEvent.setup();

  render(
    <I18nProvider initialLocale="en">
      <LocaleProbe />
    </I18nProvider>,
  );

  expect(document.documentElement.lang).toBe("en");
  expect(document.documentElement.dir).toBe("ltr");
  expect(screen.getByText("ltr")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Persian" }));

  expect(document.documentElement.lang).toBe("fa");
  expect(document.documentElement.dir).toBe("rtl");
  expect(screen.getByText("rtl")).toBeInTheDocument();
});

test("accept language helper follows the selected locale", () => {
  expect(getAcceptLanguageHeader("en")).toContain("en-US");
  expect(getAcceptLanguageHeader("fa")).toContain("fa-IR");
  expect(getTextDirection("fa")).toBe("rtl");
});

function LocaleProbe() {
  const { changeLocale, direction, t } = useI18n();

  return (
    <div>
      <p>{direction}</p>
      <p>{t("actions.confirm")}</p>
      <button type="button" onClick={() => changeLocale("fa")}>
        Persian
      </button>
    </div>
  );
}

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) {
    return [prefix];
  }

  return Object.keys(value)
    .flatMap((key) => collectKeys(value[key], joinKey(prefix, key)))
    .sort();
}

function joinKey(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
