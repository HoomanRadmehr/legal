import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { DeadlineDetail } from "../types";
import {
  deadlinePriorityLabel,
  deadlineStatusLabel,
  formatDateTime,
  statusTone,
} from "./deadlineLabels";

export function DeadlineSummary({ deadline }: { deadline: DeadlineDetail }) {
  return (
    <div className="deadline-detail-grid">
      <section aria-labelledby="deadline-summary-title">
        <h2 id="deadline-summary-title">Summary</h2>
        <dl className="deadline-definition-list">
          <DetailItem label="Title" value={deadline.title} />
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge
                label={deadlineStatusLabel(deadline.status)}
                tone={statusTone(deadline.status)}
              />
            </dd>
          </div>
          <DetailItem
            label="Priority"
            value={deadlinePriorityLabel(deadline.priority)}
          />
          <DetailItem label="Due" value={formatDateTime(deadline.due_at)} />
          <DetailItem
            label="Reminder"
            value={deadline.reminder_enabled ? "Enabled" : "Disabled"}
          />
        </dl>
      </section>
      <section aria-labelledby="deadline-links-title">
        <h2 id="deadline-links-title">Matter and assignee</h2>
        <dl className="deadline-definition-list">
          <TechnicalItem label="Matter" value={deadline.matter_id} />
          <TechnicalItem label="Assignee" value={deadline.assignee_id} />
          <TechnicalItem label="Deadline ID" value={deadline.id} />
        </dl>
      </section>
      <section aria-labelledby="deadline-description-title">
        <h2 id="deadline-description-title">Description</h2>
        <p>{deadline.description || "No description provided."}</p>
      </section>
      <section aria-labelledby="deadline-final-state-title">
        <h2 id="deadline-final-state-title">Final state</h2>
        <dl className="deadline-definition-list">
          <DetailItem label="Completed at" value={deadline.completed_at} />
          <DetailItem label="Cancelled at" value={deadline.cancelled_at} />
        </dl>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not set"}</dd>
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
