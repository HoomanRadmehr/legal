import { Link } from "react-router-dom";

import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useDeadlineDetail } from "../../deadlines/hooks";
import {
  deadlineStatusLabel,
  statusTone as deadlineStatusTone,
} from "../../deadlines/components/deadlineLabels";
import { useRelatedMatterLinks } from "../hooks";
import type { NoticeDetail } from "../types";
import {
  formatDateTime,
  noticePriorityLabel,
  noticeResponseStatusLabel,
  noticeStatusLabel,
  responseTone,
  statusTone,
} from "./noticeLabels";

export function NoticeSummary({ notice }: { notice: NoticeDetail }) {
  return (
    <div className="notice-detail-grid">
      <section aria-labelledby="notice-overview-title">
        <h2 id="notice-overview-title">Notice overview</h2>
        <dl className="notice-definition-list">
          <SummaryText
            label="Reference"
            value={notice.reference_code}
            technical
          />
          <SummaryText label="Title" value={notice.title} />
          <SummaryText label="Sender" value={notice.sender} />
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge
                label={noticeStatusLabel(notice.status)}
                tone={statusTone(notice.status)}
              />
            </dd>
          </div>
          <SummaryText
            label="Priority"
            value={noticePriorityLabel(notice.priority)}
          />
          <div>
            <dt>Response status</dt>
            <dd>
              <StatusBadge
                label={noticeResponseStatusLabel(notice.response_status)}
                tone={responseTone(notice.response_status)}
              />
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="notice-dates-title">
        <h2 id="notice-dates-title">Dates</h2>
        <dl className="notice-definition-list">
          <SummaryText label="Received date" value={notice.received_date} />
          <SummaryText
            label="Response deadline"
            value={formatDateTime(notice.response_deadline)}
          />
          <SummaryText
            label="Opened on"
            value={notice.opened_on ?? "Not set"}
          />
          <SummaryText
            label="Closed on"
            value={notice.closed_on ?? "Not set"}
          />
          <SummaryText
            label="Archived at"
            value={
              notice.archived_at ? formatDateTime(notice.archived_at) : "Active"
            }
          />
        </dl>
      </section>
      <section aria-labelledby="notice-links-title">
        <h2 id="notice-links-title">Linked records</h2>
        <dl className="notice-definition-list">
          <div>
            <dt>Linked deadline</dt>
            <dd>
              <Link to={`/deadlines/${notice.linked_deadline_id}`}>
                <TechnicalValue>{notice.linked_deadline_id}</TechnicalValue>
              </Link>
            </dd>
          </div>
          <LinkedDeadlineState deadlineId={notice.linked_deadline_id} />
          <div>
            <dt>Related matters</dt>
            <dd>
              <RelatedMatterLinks matterIds={notice.related_matter_ids} />
            </dd>
          </div>
          <SummaryText
            label="Owner membership"
            value={notice.owner_id}
            technical
          />
        </dl>
      </section>
      <section aria-labelledby="notice-description-title">
        <h2 id="notice-description-title">Description</h2>
        <p>{notice.description || "No description provided."}</p>
      </section>
    </div>
  );
}

function LinkedDeadlineState({ deadlineId }: { deadlineId: string }) {
  const query = useDeadlineDetail(deadlineId);

  if (query.isLoading) {
    return <SummaryText label="Linked deadline status" value="Loading" />;
  }
  if (query.isError || !query.data) {
    return <SummaryText label="Linked deadline status" value="Unavailable" />;
  }

  return (
    <>
      <div>
        <dt>Linked deadline status</dt>
        <dd>
          <StatusBadge
            label={deadlineStatusLabel(query.data.status)}
            tone={deadlineStatusTone(query.data.status)}
          />
        </dd>
      </div>
      <SummaryText
        label="Linked deadline assignee"
        value={query.data.assignee_id}
        technical
      />
    </>
  );
}

function RelatedMatterLinks({ matterIds }: { matterIds: string[] }) {
  const query = useRelatedMatterLinks(matterIds);

  if (matterIds.length === 0) {
    return "None";
  }
  if (query.isLoading) {
    return "Loading related matters";
  }
  if (query.isError || !query.data || query.data.length === 0) {
    return "Related matters are not visible.";
  }

  return (
    <ul className="notice-related-id-list">
      {query.data.map((matter) => (
        <li key={matter.id}>
          <Link to={matter.to}>
            <TechnicalValue>{matter.reference_code}</TechnicalValue>{" "}
            {matter.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SummaryText({
  label,
  technical,
  value,
}: {
  label: string;
  technical?: boolean;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{technical ? <TechnicalValue>{value}</TechnicalValue> : value}</dd>
    </div>
  );
}
