import { useI18n } from "../../../i18n";
import type { DeadlineView } from "../types";
import { DEADLINE_VIEWS } from "../deadlineViews";
import { deadlineText, deadlineViewLabel } from "./deadlineLabels";

export function DeadlineViewTabs({
  activeView,
  onChange,
}: {
  activeView: DeadlineView;
  onChange: (view: DeadlineView) => void;
}) {
  const { locale } = useI18n();
  const labels = deadlineText(locale);

  return (
    <div className="deadline-tabs" role="tablist" aria-label={labels.viewTabs}>
      {DEADLINE_VIEWS.map((view) => (
        <button
          key={view}
          aria-selected={activeView === view}
          className={activeView === view ? "deadline-tabs__active" : ""}
          onClick={() => onChange(view)}
          role="tab"
          type="button"
        >
          {deadlineViewLabel(view, locale)}
        </button>
      ))}
    </div>
  );
}
