import { useState, type ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import {
  inputToIsoDate,
  inputToLocalDateTime,
  isoDateToInput,
  localDateTimeToInput,
} from "../i18n/date";
import { useI18n } from "../i18n";

type DateInputProps = {
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  registration: UseFormRegisterReturn;
  value: string | null | undefined;
};

type DateFieldProps = Omit<DateInputProps, "value"> & {
  draftValue: string;
  locale: "en" | "fa";
};

export function LocalizedDateInput({
  id,
  label,
  onValueChange,
  registration,
  value,
}: DateInputProps) {
  const { locale } = useI18n();
  const draft = isoDateToInput(value, locale);

  return (
    <LocalizedDateField
      key={`${locale}:${value ?? ""}`}
      draftValue={draft}
      id={id}
      label={label}
      locale={locale}
      onValueChange={onValueChange}
      registration={registration}
    />
  );
}

function LocalizedDateField({
  draftValue,
  id,
  label,
  locale,
  onValueChange,
  registration,
}: DateFieldProps) {
  const inputId = `${id}_localized`;
  const [draft, setDraft] = useState(draftValue);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setDraft(nextValue);
    if (!nextValue || isCompleteDate(nextValue)) {
      onValueChange(inputToIsoDate(nextValue, locale));
    }
  }

  return (
    <>
      <input {...registration} id={id} type="hidden" />
      <label htmlFor={inputId}>
        {label}
        <input
          className="localized-date-input"
          dir="ltr"
          id={inputId}
          inputMode="numeric"
          onChange={handleChange}
          placeholder={locale === "fa" ? "1406-01-01" : "2027-03-21"}
          value={draft}
        />
      </label>
    </>
  );
}

export function LocalizedDateTimeInput({
  id,
  label,
  onValueChange,
  registration,
  value,
}: DateInputProps) {
  const { locale } = useI18n();
  const draft = localDateTimeToInput(value, locale);

  return (
    <LocalizedDateTimeField
      key={`${locale}:${value ?? ""}`}
      draftValue={draft}
      id={id}
      label={label}
      locale={locale}
      onValueChange={onValueChange}
      registration={registration}
    />
  );
}

function LocalizedDateTimeField({
  draftValue,
  id,
  label,
  locale,
  onValueChange,
  registration,
}: DateFieldProps) {
  const inputId = `${id}_localized`;
  const [draft, setDraft] = useState(draftValue);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setDraft(nextValue);
    if (!nextValue || isCompleteDateTime(nextValue)) {
      onValueChange(inputToLocalDateTime(nextValue, locale));
    }
  }

  return (
    <>
      <input {...registration} id={id} type="hidden" />
      <label htmlFor={inputId}>
        {label}
        <input
          className="localized-date-input"
          dir="ltr"
          id={inputId}
          inputMode="numeric"
          onChange={handleChange}
          placeholder={
            locale === "fa" ? "1406-01-01 09:30" : "2027-03-21 09:30"
          }
          value={draft}
        />
      </label>
    </>
  );
}

function isCompleteDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isCompleteDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(value);
}
