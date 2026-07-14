import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { CaseTimeline } from "../components/CaseTimeline";

test("renders timeline loading and error states", () => {
  const { rerender } = render(
    <CaseTimeline events={[]} isError={false} isLoading={true} />,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Loading timeline");

  rerender(
    <CaseTimeline
      errorMessage="Rate limit exceeded."
      events={[]}
      isError={true}
      isLoading={false}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Rate limit exceeded.");
});
