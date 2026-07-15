import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { I18nProvider } from "../../../i18n";
import { ContractTimeline } from "../components/ContractTimeline";

test("uses safe labels for known and unknown timeline actions", () => {
  render(
    <I18nProvider initialLocale="en">
      <ContractTimeline
        errorMessage={undefined}
        isError={false}
        isLoading={false}
        events={[
          {
            action: "matter.archived",
            actor_membership_id: null,
            after_values: {},
            before_values: {},
            created_at: "2027-01-01T10:00:00Z",
            id: "event-1",
            metadata: {},
            target_id: "contract-1",
            target_type: "matter",
          },
          {
            action: "unexpected.internal_code",
            actor_membership_id: null,
            after_values: {},
            before_values: {},
            created_at: "2027-01-02T10:00:00Z",
            id: "event-2",
            metadata: {},
            target_id: "contract-1",
            target_type: "matter",
          },
        ]}
      />
    </I18nProvider>,
  );

  expect(screen.getByText("Contract archived")).toBeInTheDocument();
  expect(screen.getByText("Contract activity")).toBeInTheDocument();
  expect(
    screen.queryByText("unexpected.internal_code"),
  ).not.toBeInTheDocument();
});
