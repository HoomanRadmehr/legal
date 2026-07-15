import { ActivityTimeline } from "../../activity/components/ActivityTimeline";
import type { NoticeTimelineEvent } from "../types";

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
  return (
    <ActivityTimeline
      ariaLabel="Notice timeline"
      context="notice"
      emptyLabel="No timeline events yet."
      errorMessage={errorMessage}
      events={events}
      isError={isError}
      isLoading={isLoading}
    />
  );
}
