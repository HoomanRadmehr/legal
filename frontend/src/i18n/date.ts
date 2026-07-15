import { format, isValid, parse } from "date-fns-jalali";

import type { SupportedLocale } from "./config";

const DATE_PATTERN = "yyyy-MM-dd";
const DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm";

export function isoDateToInput(
  value: string | null | undefined,
  locale: SupportedLocale,
): string {
  if (!value) {
    return "";
  }
  if (locale === "en") {
    return value;
  }
  const date = dateFromIsoDate(value);
  return format(date, DATE_PATTERN);
}

export function inputToIsoDate(value: string, locale: SupportedLocale): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (locale === "en") {
    return trimmed;
  }
  const date = parse(trimmed, DATE_PATTERN, new Date());
  return isValid(date) ? isoDateFromDate(date) : trimmed;
}

export function localDateTimeToInput(
  value: string | null | undefined,
  locale: SupportedLocale,
): string {
  if (!value) {
    return "";
  }
  const normalized = value.replace("T", " ").slice(0, 16);
  if (locale === "en") {
    return value.slice(0, 16);
  }
  const [datePart = "", timePart = ""] = normalized.split(" ");
  const localizedDate = isoDateToInput(datePart, locale);
  return localizedDate && timePart
    ? `${localizedDate} ${timePart}`
    : normalized;
}

export function inputToLocalDateTime(
  value: string,
  locale: SupportedLocale,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (locale === "en") {
    return trimmed.replace(" ", "T");
  }
  const date = parse(trimmed, DATE_TIME_PATTERN, new Date());
  return isValid(date)
    ? `${isoDateFromDate(date)}T${timeFromDate(date)}`
    : trimmed;
}

export function formatDate(
  value: string | null | undefined,
  locale: SupportedLocale,
): string {
  if (!value) {
    return locale === "fa" ? "ثبت نشده" : "Not set";
  }
  if (locale === "fa") {
    return format(dateFromIsoDate(value), "d MMMM yyyy");
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    dateFromIsoDate(value),
  );
}

export function formatDateTime(
  value: string | null | undefined,
  locale: SupportedLocale,
): string {
  if (!value) {
    return locale === "fa" ? "ثبت نشده" : "Not set";
  }
  if (locale === "fa") {
    return format(new Date(value), "d MMMM yyyy HH:mm");
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateFromIsoDate(value: string): Date {
  const [year = "0", month = "1", day = "1"] = value.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function isoDateFromDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeFromDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
