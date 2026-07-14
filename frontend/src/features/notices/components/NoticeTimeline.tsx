import { ErrorState, LoadingState } from "../../../components/standardStates";
import type { NoticeTimelineEvent } from "../types";
import { formatDateTime, timelineActionLabel } from "./noticeLabels";

export function NoticeTimeline({
  errorMessage,
  events,
  isError,
  isLoading,
}: {
  errorMessage?: string;
  events: NoticeTimelineEvent[];
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
    <ol className="notice-timeline" aria-label="Notice timeline">
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
