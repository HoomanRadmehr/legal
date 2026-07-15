import { ActivityTimeline } from "../../activity/components/ActivityTimeline";
import type { ContractTimelineEvent } from "../types";

export function ContractTimeline({
  errorMessage,
  events,
  isError,
  isLoading,
}: {
  errorMessage?: string;
  events: ContractTimelineEvent[];
  isError: boolean;
  isLoading: boolean;
}) {
  return (
    <ActivityTimeline
      ariaLabel="Contract timeline"
      context="contract"
      emptyLabel="No timeline events yet."
      errorMessage={errorMessage}
      events={events}
      isError={isError}
      isLoading={isLoading}
    />
  );
}
