import { ActivityTimeline } from "../../activity/components/ActivityTimeline";
import { useI18n } from "../../../i18n";
import type { ContractTimelineEvent } from "../types";
import { contractText } from "./contractLabels";

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
  const { locale } = useI18n();
  const labels = contractText(locale);

  return (
    <ActivityTimeline
      ariaLabel={labels.timelineAria}
      context="contract"
      emptyLabel={labels.timelineEmpty}
      errorMessage={errorMessage}
      events={events}
      isError={isError}
      isLoading={isLoading}
    />
  );
}
