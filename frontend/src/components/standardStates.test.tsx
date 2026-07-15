import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "./standardStates";
import { I18nProvider } from "../i18n";

test("renders an accessible loading state", () => {
  render(<LoadingState label="Loading matters" />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading matters");
});

test("renders empty and not found states with headings", () => {
  render(
    <I18nProvider initialLocale="en">
      <EmptyState title="No matters" message="Create the first matter." />
      <NotFoundState />
    </I18nProvider>,
  );

  expect(
    screen.getByRole("heading", { name: "No matters" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Page not found" }),
  ).toBeInTheDocument();
});

test("renders error states without raw server details", () => {
  render(
    <I18nProvider initialLocale="en">
      <ErrorState
        message="Too many requests."
        requestId="req-123"
        retryAfterSeconds={30}
      />
      <ForbiddenState />
    </I18nProvider>,
  );

  const alerts = screen.getAllByRole("alert");
  expect(alerts[0]).toHaveTextContent("Too many requests.");
  expect(alerts[0]).toHaveTextContent("Request ID req-123");
  expect(alerts[0]).toHaveTextContent("Retry after 30 seconds");
  expect(alerts[1]).toHaveTextContent("Access denied");
});
