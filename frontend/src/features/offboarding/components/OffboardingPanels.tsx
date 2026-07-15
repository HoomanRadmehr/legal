import type { FormEvent } from "react";

import { fillCount, offboardingText } from "../text";
import type { OffboardingPreview, OffboardingRun } from "../types";

const CONFIRMATION_VALUE = "OFFBOARD";

export function PreviewPanel({
  labels,
  preview,
}: {
  labels: ReturnType<typeof offboardingText>;
  preview: OffboardingPreview;
}) {
  return (
    <section className="offboarding-preview" aria-labelledby="preview-title">
      <h2 id="preview-title">{labels.preview}</h2>
      <p>{labels.previewReady}</p>
      <CountGrid labels={labels} preview={preview} />
      <SummaryList
        emptyLabel={labels.emptyMatters}
        items={preview.owned_matters.map(matterLabel)}
        title={labels.matters}
      />
      <SummaryList
        emptyLabel={labels.emptyTasks}
        items={preview.open_tasks.map(workLabel)}
        title={labels.tasks}
      />
      <SummaryList
        emptyLabel={labels.emptyDeadlines}
        items={preview.open_deadlines.map(workLabel)}
        title={labels.deadlines}
      />
      <SummaryList
        emptyLabel={labels.emptyAccess}
        items={preview.active_access_grants.map(accessLabel)}
        title={labels.accessGrants}
      />
      {preview.warnings.length > 0 ? (
        <SummaryList items={preview.warnings} title={labels.warnings} />
      ) : null}
    </section>
  );
}

export function ExecuteForm({
  confirmation,
  isPending,
  labels,
  onConfirmationChange,
  onSubmit,
}: {
  confirmation: string;
  isPending: boolean;
  labels: ReturnType<typeof offboardingText>;
  onConfirmationChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="offboarding-execute" onSubmit={onSubmit}>
      <label>
        {labels.confirmation}
        <input
          aria-describedby="offboarding-confirm-help"
          onChange={(event) => onConfirmationChange(event.currentTarget.value)}
          value={confirmation}
        />
      </label>
      <p id="offboarding-confirm-help">{labels.confirmHelp}</p>
      <button
        disabled={isPending || confirmation !== CONFIRMATION_VALUE}
        type="submit"
      >
        {isPending ? labels.executing : labels.execute}
      </button>
    </form>
  );
}

export function RunResult({
  labels,
  run,
}: {
  labels: ReturnType<typeof offboardingText>;
  run: OffboardingRun;
}) {
  return (
    <section className="offboarding-result" aria-labelledby="result-title">
      <h2 id="result-title">{labels.completed}</h2>
      <dl>
        <div>
          <dt>{labels.status}</dt>
          <dd>{run.status}</dd>
        </div>
        <div>
          <dt>{labels.runId}</dt>
          <dd>{run.id}</dd>
        </div>
      </dl>
      <CountGrid labels={labels} preview={run.preview} />
    </section>
  );
}

function CountGrid({
  labels,
  preview,
}: {
  labels: ReturnType<typeof offboardingText>;
  preview: OffboardingPreview;
}) {
  return (
    <dl className="offboarding-counts">
      <div>
        <dt>{labels.matters}</dt>
        <dd>{fillCount(labels.matterCount, preview.counts.owned_matters)}</dd>
      </div>
      <div>
        <dt>{labels.tasks}</dt>
        <dd>{fillCount(labels.taskCount, preview.counts.open_tasks)}</dd>
      </div>
      <div>
        <dt>{labels.deadlines}</dt>
        <dd>
          {fillCount(labels.deadlineCount, preview.counts.open_deadlines)}
        </dd>
      </div>
      <div>
        <dt>{labels.accessGrants}</dt>
        <dd>{preview.counts.active_access_grants}</dd>
      </div>
    </dl>
  );
}

function SummaryList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel?: string;
  items: string[];
  title: string;
}) {
  return (
    <section className="offboarding-summary">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyLabel}</p>
      )}
    </section>
  );
}

function matterLabel(matter: OffboardingPreview["owned_matters"][number]) {
  return `${matter.reference_code} - ${matter.title}`;
}

function workLabel(work: OffboardingPreview["open_tasks"][number]) {
  return `${work.title} (${work.matter_id})`;
}

function accessLabel(
  access: OffboardingPreview["active_access_grants"][number],
) {
  return `${access.level} (${access.matter_id})`;
}
