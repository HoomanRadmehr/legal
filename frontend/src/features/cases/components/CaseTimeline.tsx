import { ActivityTimeline } from "../../activity/components/ActivityTimeline";
import { useI18n } from "../../../i18n";
import type { CaseTimelineEvent } from "../types";
import { caseText } from "./caseLabels";

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
  const { locale } = useI18n();
  const labels = caseText(locale);

  return (
    <ActivityTimeline
      ariaLabel={labels.timelineAria}
      context="case"
      emptyLabel={labels.timelineEmpty}
      errorMessage={errorMessage}
      events={events}
      isError={isError}
      isLoading={isLoading}
    />
  );
}
