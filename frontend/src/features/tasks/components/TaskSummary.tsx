import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { TaskDetail } from "../types";
import {
  formatDateTime,
  taskStatusLabel,
  taskStatusTone,
  taskText,
} from "./taskLabels";

export function TaskSummary({ task }: { task: TaskDetail }) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  return (
    <div className="task-detail-grid">
      <section aria-labelledby="task-summary-title">
        <h2 id="task-summary-title">{labels.summary}</h2>
        <dl className="task-definition-list">
          <DetailItem label={labels.title} value={task.title} />
          <div>
            <dt>{labels.status}</dt>
            <dd>
              <StatusBadge
                label={taskStatusLabel(task.status, locale)}
                tone={taskStatusTone(task.status)}
              />
            </dd>
          </div>
          <DetailItem label={labels.due} value={formatDateTime(task.due_at, locale)} />
        </dl>
      </section>
      <section aria-labelledby="task-links-title">
        <h2 id="task-links-title">{labels.assignment}</h2>
        <dl className="task-definition-list">
          <TechnicalItem label={labels.matter} value={task.matter_id} />
          <TechnicalItem label={labels.assignee} value={task.assignee_id} />
          <TechnicalItem label={labels.taskId} value={task.id} />
        </dl>
      </section>
      <section aria-labelledby="task-description-title">
        <h2 id="task-description-title">{labels.description}</h2>
        <p>{task.description || labels.noDescription}</p>
      </section>
      <section aria-labelledby="task-final-state-title">
        <h2 id="task-final-state-title">{labels.finalState}</h2>
        <dl className="task-definition-list">
          <DetailItem
            label={labels.completedAt}
            value={formatDateTime(task.completed_at, locale)}
          />
          <DetailItem
            label={labels.cancelledAt}
            value={formatDateTime(task.cancelled_at, locale)}
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
