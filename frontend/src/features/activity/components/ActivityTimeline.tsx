import { ErrorState, LoadingState } from "../../../components/standardStates";
import { useI18n } from "../../../i18n";
import { activityActionLabel, reviewedFieldLabel } from "../activityLabels";
import type { ActivityItem, TimelineContext } from "../types";
import "../activity.css";

export function ActivityTimeline({
  ariaLabel,
  context = "activity",
  emptyLabel,
  errorMessage,
  events,
  isError,
  isLoading,
}: {
  ariaLabel: string;
  context?: TimelineContext;
  emptyLabel: string;
  errorMessage?: string;
  events: ActivityItem[];
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
    return <p>{emptyLabel}</p>;
  }

  return (
    <ol className="activity-timeline" aria-label={ariaLabel}>
      {events.map((event) => (
        <ActivityTimelineItem context={context} event={event} key={event.id} />
      ))}
    </ol>
  );
}

function ActivityTimelineItem({
  context,
  event,
}: {
  context: TimelineContext;
  event: ActivityItem;
}) {
  const { locale } = useI18n();
  const changes = reviewedChanges(event, locale);

  return (
    <li>
      <strong>
        {activityActionLabel({ action: event.action, context, locale })}
      </strong>
      <time dateTime={event.created_at}>
        {formatDateTime(event.created_at)}
      </time>
      {changes.length > 0 ? (
        <dl>
          {changes.map((change) => (
            <div key={change.label}>
              <dt>{change.label}</dt>
              <dd>{change.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

function reviewedChanges(event: ActivityItem, locale: "en" | "fa") {
  return Object.keys(event.after_values).flatMap((field) => {
    const label = reviewedFieldLabel(field, locale);
    const value = event.after_values[field];
    if (
      !label ||
      !isDisplayable(value) ||
      event.before_values[field] === value
    ) {
      return [];
    }
    return [{ label, value: String(value) }];
  });
}

function isDisplayable(value: unknown): value is boolean | number | string {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
