import type { DeadlineView } from "../types";
import { DEADLINE_VIEWS } from "../deadlineViews";
import { deadlineViewLabel } from "./deadlineLabels";

export function DeadlineViewTabs({
  activeView,
  onChange,
}: {
  activeView: DeadlineView;
  onChange: (view: DeadlineView) => void;
}) {
  return (
    <div className="deadline-tabs" role="tablist" aria-label="Deadline views">
      {DEADLINE_VIEWS.map((view) => (
        <button
          key={view}
          aria-selected={activeView === view}
          className={activeView === view ? "deadline-tabs__active" : ""}
          onClick={() => onChange(view)}
          role="tab"
          type="button"
        >
          {deadlineViewLabel(view)}
        </button>
      ))}
    </div>
  );
}
