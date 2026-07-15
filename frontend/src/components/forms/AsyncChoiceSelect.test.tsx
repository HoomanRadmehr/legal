import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../app/queryClient";
import { I18nProvider } from "../../i18n";
import { AsyncChoiceSelect, type ChoicePage } from "./AsyncChoiceSelect";

afterEach(() => {
  vi.useRealTimers();
});

test("loads the first page only after opening", async () => {
  const loadPage = vi.fn(async () => choicePage([{ id: "1", label: "Sara" }]));
  renderChoice(<AsyncChoiceSelect {...baseProps(loadPage)} />);

  expect(loadPage).not.toHaveBeenCalled();
  await userEvent.click(screen.getByLabelText("Owner"));

  expect(await screen.findByText("Sara")).toBeInTheDocument();
  expect(loadPage).toHaveBeenCalledWith({ cursor: undefined, query: "" });
});

test("debounces and trims search text", async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const loadPage = vi.fn(async () => choicePage([]));
  renderChoice(<AsyncChoiceSelect {...baseProps(loadPage)} />);

  await user.click(screen.getByLabelText("Owner"));
  await user.type(screen.getByLabelText("Owner"), "  sara  ");
  vi.advanceTimersByTime(300);

  await waitFor(() => {
    expect(loadPage).toHaveBeenLastCalledWith({
      cursor: undefined,
      query: "sara",
    });
  });
});

test("loads the next cursor page on scroll and stops at the end", async () => {
  const loadPage = vi
    .fn()
    .mockResolvedValueOnce(choicePage([{ id: "1", label: "Sara" }], "next"))
    .mockResolvedValueOnce(choicePage([{ id: "2", label: "Reza" }]));
  renderChoice(<AsyncChoiceSelect {...baseProps(loadPage)} />);

  await userEvent.click(screen.getByLabelText("Owner"));
  const list = await screen.findByRole("listbox");
  const scroller = list.parentElement as HTMLElement;
  makeScrollableNearBottom(scroller);
  fireEvent.scroll(scroller);
  await screen.findByText("Reza");
  fireEvent.scroll(scroller);

  expect(loadPage).toHaveBeenCalledTimes(2);
  expect(loadPage).toHaveBeenLastCalledWith({ cursor: "next", query: "" });
});

test("shows localized retry guidance for rate limits", async () => {
  const loadPage = vi.fn(async () => {
    throw Object.assign(new Error("Rate limited"), {
      code: "rate_limit_exceeded",
      details: {},
      retryAfterSeconds: 12,
      status: 429,
    });
  });
  renderChoice(<AsyncChoiceSelect {...baseProps(loadPage)} />);

  await userEvent.click(screen.getByLabelText("Owner"));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Try again in 12 seconds.",
  );
});

function renderChoice(children: ReactNode) {
  return render(
    <I18nProvider initialLocale="en">
      <QueryClientProvider client={createAppQueryClient()}>
        {children}
      </QueryClientProvider>
    </I18nProvider>,
  );
}

function baseProps(loadPage: () => Promise<ChoicePage>) {
  return {
    label: "Owner",
    loadPage,
    onChange: vi.fn(),
    queryKey: ["test-choice"],
    value: null,
  };
}

function choicePage(
  results: ChoicePage["results"],
  nextCursor: string | null = null,
): ChoicePage {
  return {
    has_more: nextCursor !== null,
    next_cursor: nextCursor,
    results,
  };
}

function makeScrollableNearBottom(element: HTMLElement) {
  Object.defineProperty(element, "clientHeight", { configurable: true, value: 100 });
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: 120 });
  Object.defineProperty(element, "scrollTop", { configurable: true, value: 16 });
}
