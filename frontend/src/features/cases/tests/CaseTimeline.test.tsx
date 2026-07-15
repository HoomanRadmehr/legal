import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { I18nProvider } from "../../../i18n";
import { CaseTimeline } from "../components/CaseTimeline";

test("renders timeline loading and error states", () => {
  const { rerender } = render(
    <I18nProvider initialLocale="en">
      <CaseTimeline events={[]} isError={false} isLoading={true} />
    </I18nProvider>,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Loading timeline");

  rerender(
    <I18nProvider initialLocale="en">
      <CaseTimeline
        errorMessage="Rate limit exceeded."
        events={[]}
        isError={true}
        isLoading={false}
      />
    </I18nProvider>,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Rate limit exceeded.");
});
