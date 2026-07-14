import { ErrorState, LoadingState } from "../../../components/standardStates";
import type { CaseTimelineEvent } from "../types";
import { timelineActionLabel } from "./caseLabels";

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
    <ol className="case-timeline" aria-label="Case timeline">
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
