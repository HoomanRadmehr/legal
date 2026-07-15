import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { DeadlineDetail } from "../types";
import {
  deadlinePriorityLabel,
  deadlineStatusLabel,
  deadlineText,
  formatDateTime,
  statusTone,
} from "./deadlineLabels";

export function DeadlineSummary({ deadline }: { deadline: DeadlineDetail }) {
  const { locale } = useI18n();
  const labels = deadlineText(locale);

  return (
    <div className="deadline-detail-grid">
      <section aria-labelledby="deadline-summary-title">
        <h2 id="deadline-summary-title">{labels.summary}</h2>
        <dl className="deadline-definition-list">
          <DetailItem label={labels.title} value={deadline.title} />
          <div>
            <dt>{labels.status}</dt>
            <dd>
              <StatusBadge
                label={deadlineStatusLabel(deadline.status, locale)}
                tone={statusTone(deadline.status)}
              />
            </dd>
          </div>
          <DetailItem
            label={labels.priority}
            value={deadlinePriorityLabel(deadline.priority, locale)}
          />
          <DetailItem
            label={labels.due}
            value={formatDateTime(deadline.due_at, locale)}
          />
          <DetailItem
            label={labels.reminder}
            value={deadline.reminder_enabled ? labels.enabled : labels.disabled}
          />
        </dl>
      </section>
      <section aria-labelledby="deadline-links-title">
        <h2 id="deadline-links-title">{labels.links}</h2>
        <dl className="deadline-definition-list">
          <TechnicalItem label={labels.matter} value={deadline.matter_id} />
          <TechnicalItem label={labels.assignee} value={deadline.assignee_id} />
          <TechnicalItem label={labels.deadlineId} value={deadline.id} />
        </dl>
      </section>
      <section aria-labelledby="deadline-description-title">
        <h2 id="deadline-description-title">{labels.description}</h2>
        <p>{deadline.description || labels.noDescription}</p>
      </section>
      <section aria-labelledby="deadline-final-state-title">
        <h2 id="deadline-final-state-title">{labels.finalState}</h2>
        <dl className="deadline-definition-list">
          <DetailItem
            label={labels.completedAt}
            value={formatDateTime(deadline.completed_at, locale)}
          />
          <DetailItem
            label={labels.cancelledAt}
            value={formatDateTime(deadline.cancelled_at, locale)}
          />
        </dl>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TechnicalItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <TechnicalValue>{value}</TechnicalValue>
      </dd>
    </div>
  );
}
