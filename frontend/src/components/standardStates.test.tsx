import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from "./standardStates";

test("renders an accessible loading state", () => {
  render(<LoadingState label="Loading matters" />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading matters");
});

test("renders empty and not found states with headings", () => {
  render(
    <>
      <EmptyState title="No matters" message="Create the first matter." />
      <NotFoundState />
    </>,
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
    <>
      <ErrorState
        message="Too many requests."
        requestId="req-123"
        retryAfterSeconds={30}
      />
      <ForbiddenState />
    </>,
  );

  const alerts = screen.getAllByRole("alert");
  expect(alerts[0]).toHaveTextContent("Too many requests.");
  expect(alerts[0]).toHaveTextContent("Request ID req-123");
  expect(alerts[0]).toHaveTextContent("Retry after 30 seconds");
  expect(alerts[1]).toHaveTextContent("Access denied");
});
