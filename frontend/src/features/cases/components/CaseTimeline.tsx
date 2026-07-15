import { ActivityTimeline } from "../../activity/components/ActivityTimeline";
import type { CaseTimelineEvent } from "../types";

export function CaseTimeline({
  errorMessage,
  events,
  isError,
  isLoading,
}: {
  errorMessage?: string;
  events: CaseTimelineEvent[];
  isError: boolean;
  isLoading: boolean;
}) {
  return (
    <ActivityTimeline
      ariaLabel="Case timeline"
      context="case"
      emptyLabel="No timeline events yet."
      errorMessage={errorMessage}
      events={events}
      isError={isError}
      isLoading={isLoading}
    />
  );
}
