import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";
import type { KeyboardEvent, UIEvent } from "react";

import { isApiError } from "../../api/errors";
import { useI18n } from "../../i18n";
import { TechnicalValue } from "../technicalValue";
import { choiceText } from "./choiceText";

export type AsyncChoice = {
  id: string;
  label: string;
  secondaryLabel?: string;
};

export type ChoicePage = {
  has_more: boolean;
  next_cursor: string | null;
  results: AsyncChoice[];
};

export type AsyncChoiceSelectProps = {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  id?: string;
  label: string;
  loadPage: (input: { cursor?: string; query: string }) => Promise<ChoicePage>;
  onChange: (value: AsyncChoice | null) => void;
  placeholder?: string;
  queryKey: readonly unknown[];
  required?: boolean;
  value: AsyncChoice | null;
};

const SEARCH_DELAY_MS = 300;

export function AsyncChoiceSelect({
  disabled = false,
  error = false,
  helperText,
  id,
  label,
  loadPage,
  onChange,
  placeholder,
  queryKey,
  required = false,
  value,
}: AsyncChoiceSelectProps) {
  const { locale } = useI18n();
  const text = choiceText(locale);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedText(search);
  const query = useInfiniteQuery({
    enabled: open && !disabled,
    getNextPageParam: (lastPage: ChoicePage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      loadPage({ cursor: pageParam, query: debouncedSearch }),
    queryKey: [...queryKey, debouncedSearch],
  });
  const choices = useMemo(
    () =>
      dedupeChoices(query.data?.pages.flatMap((page) => page.results) ?? []),
    [query.data],
  );
  const message = choiceMessage({ error: query.error, helperText, text });

  return (
    <div className="async-choice">
      <label className="async-choice__label" htmlFor={inputId}>
        {label}
      </label>
      {value ? (
        <SelectedChoice choice={value} onClear={() => onChange(null)} />
      ) : null}
      <input
        aria-autocomplete="list"
        aria-controls={open ? `${inputId}-listbox` : undefined}
        aria-describedby={message ? helperId : undefined}
        aria-expanded={open}
        aria-invalid={error || query.isError}
        aria-required={required}
        autoComplete="off"
        disabled={disabled}
        id={inputId}
        onChange={(event) => setSearch(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) =>
          handleChoiceKey(event, choices, onChange, setOpen)
        }
        placeholder={placeholder ?? text.selectAnOption}
        role="combobox"
        value={search}
      />
      {open ? (
        <ChoiceList
          choices={choices}
          id={`${inputId}-listbox`}
          isLoading={query.isLoading || query.isFetching}
          isLoadingMore={query.isFetchingNextPage}
          onPick={(choice) => {
            onChange(choice);
            setSearch("");
            setOpen(false);
          }}
          onScrollEnd={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          text={text}
        />
      ) : null}
      {message ? (
        <p
          className="async-choice__help"
          id={helperId}
          role={query.isError ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function SelectedChoice({
  choice,
  onClear,
}: {
  choice: AsyncChoice;
  onClear: () => void;
}) {
  const { locale } = useI18n();
  const text = choiceText(locale);

  return (
    <div className="async-choice__selected">
      <span>{choice.label}</span>
      {choice.secondaryLabel ? (
        <TechnicalValue>{choice.secondaryLabel}</TechnicalValue>
      ) : null}
      <button aria-label={text.clearSelection} onClick={onClear} type="button">
        {text.clearSelection}
      </button>
    </div>
  );
}

function ChoiceList({
  choices,
  id,
  isLoading,
  isLoadingMore,
  onPick,
  onScrollEnd,
  text,
}: {
  choices: AsyncChoice[];
  id: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  onPick: (choice: AsyncChoice) => void;
  onScrollEnd: () => void;
  text: ReturnType<typeof choiceText>;
}) {
  return (
    <div
      className="async-choice__list"
      onScroll={(event) => handleScroll(event, onScrollEnd)}
    >
      {isLoading && choices.length === 0 ? (
        <p role="status">{text.searching}</p>
      ) : null}
      {!isLoading && choices.length === 0 ? <p>{text.noChoicesFound}</p> : null}
      <ul id={id} role="listbox">
        {choices.map((choice) => (
          <li aria-selected={false} key={choice.id} role="option">
            <button onClick={() => onPick(choice)} type="button">
              <span>{choice.label}</span>
              {choice.secondaryLabel ? (
                <TechnicalValue>{choice.secondaryLabel}</TechnicalValue>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {isLoadingMore ? <p role="status">{text.loadingMore}</p> : null}
    </div>
  );
}

function useDebouncedText(value: string): string {
  const [debounced, setDebounced] = useState(value.trim());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value.trim());
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [value]);

  return debounced;
}

function dedupeChoices(choices: AsyncChoice[]): AsyncChoice[] {
  const seen = new Set<string>();
  return choices.filter((choice) => {
    if (seen.has(choice.id)) {
      return false;
    }
    seen.add(choice.id);
    return true;
  });
}

function handleChoiceKey(
  event: KeyboardEvent<HTMLInputElement>,
  choices: AsyncChoice[],
  onChange: (value: AsyncChoice | null) => void,
  setOpen: (open: boolean) => void,
): void {
  if (event.key === "Escape") {
    setOpen(false);
  }
  if (event.key === "Enter" && choices[0]) {
    event.preventDefault();
    onChange(choices[0]);
    setOpen(false);
  }
}

function handleScroll(
  event: UIEvent<HTMLDivElement>,
  onScrollEnd: () => void,
): void {
  const target = event.currentTarget;
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 24) {
    onScrollEnd();
  }
}

function choiceMessage({
  error,
  helperText,
  text,
}: {
  error: unknown;
  helperText?: string;
  text: ReturnType<typeof choiceText>;
}): string {
  if (isApiError(error) && error.status === 429 && error.retryAfterSeconds) {
    return text.retryAfter.replace(
      "{{seconds}}",
      String(error.retryAfterSeconds),
    );
  }
  if (error) {
    return text.failedToLoadChoices;
  }
  return helperText ?? "";
}
