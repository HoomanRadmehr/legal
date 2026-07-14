import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { TaskDetail } from "../types";
import { formatDateTime, taskStatusLabel, taskStatusTone } from "./taskLabels";

export function TaskSummary({ task }: { task: TaskDetail }) {
  return (
    <div className="task-detail-grid">
      <section aria-labelledby="task-summary-title">
        <h2 id="task-summary-title">Summary</h2>
        <dl className="task-definition-list">
          <DetailItem label="Title" value={task.title} />
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge
                label={taskStatusLabel(task.status)}
                tone={taskStatusTone(task.status)}
              />
            </dd>
          </div>
          <DetailItem label="Due" value={formatDateTime(task.due_at)} />
        </dl>
      </section>
      <section aria-labelledby="task-links-title">
        <h2 id="task-links-title">Matter and assignee</h2>
        <dl className="task-definition-list">
          <TechnicalItem label="Matter" value={task.matter_id} />
          <TechnicalItem label="Assignee" value={task.assignee_id} />
          <TechnicalItem label="Task ID" value={task.id} />
        </dl>
      </section>
      <section aria-labelledby="task-description-title">
        <h2 id="task-description-title">Description</h2>
        <p>{task.description || "No description provided."}</p>
      </section>
      <section aria-labelledby="task-final-state-title">
        <h2 id="task-final-state-title">Final state</h2>
        <dl className="task-definition-list">
          <DetailItem
            label="Completed at"
            value={formatDateTime(task.completed_at)}
          />
          <DetailItem
            label="Cancelled at"
            value={formatDateTime(task.cancelled_at)}
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
