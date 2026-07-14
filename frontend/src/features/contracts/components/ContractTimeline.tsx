import { ErrorState, LoadingState } from "../../../components/standardStates";
import type { ContractTimelineEvent } from "../types";
import { timelineActionLabel } from "./contractLabels";

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
  if (isLoading) {
    return <LoadingState label="Loading timeline" />;
  }
  if (isError) {
    return (
      <ErrorState
        title="Timeline unavailable"
        message={errorMessage ?? "The timeline could not be loaded."}
      />
    );
  }
  if (events.length === 0) {
    return <p>No timeline events yet.</p>;
  }

  return (
    <ol className="contract-timeline" aria-label="Contract timeline">
      {events.map((event) => (
        <li key={event.id}>
          <strong>{timelineActionLabel(event.action)}</strong>
          <time dateTime={event.created_at}>
            {formatDateTime(event.created_at)}
          </time>
        </li>
      ))}
    </ol>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
