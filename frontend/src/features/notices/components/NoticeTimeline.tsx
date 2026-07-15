import { ActivityTimeline } from "../../activity/components/ActivityTimeline";
import { useI18n } from "../../../i18n";
import type { NoticeTimelineEvent } from "../types";
import { noticeText } from "./noticeLabels";

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
  const { locale } = useI18n();
  const labels = noticeText(locale);

  return (
    <ActivityTimeline
      ariaLabel={labels.timelineAria}
      context="notice"
      emptyLabel={labels.timelineEmpty}
      errorMessage={errorMessage}
      events={events}
      isError={isError}
      isLoading={isLoading}
    />
  );
}
