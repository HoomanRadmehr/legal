import { Link } from "react-router-dom";

import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import { formatDate } from "../../../i18n/date";
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
  noticeText,
  responseTone,
  statusTone,
} from "./noticeLabels";

export function NoticeSummary({ notice }: { notice: NoticeDetail }) {
  const { locale } = useI18n();
  const labels = noticeText(locale);

  return (
    <div className="notice-detail-grid">
      <section aria-labelledby="notice-overview-title">
        <h2 id="notice-overview-title">{labels.overview}</h2>
        <dl className="notice-definition-list">
          <SummaryText
            label={labels.reference}
            value={notice.reference_code}
            technical
          />
          <SummaryText label={labels.title} value={notice.title} />
          <SummaryText label={labels.sender} value={notice.sender} />
          <div>
            <dt>{labels.status}</dt>
            <dd>
              <StatusBadge
                label={noticeStatusLabel(notice.status, locale)}
                tone={statusTone(notice.status)}
              />
            </dd>
          </div>
          <SummaryText
            label={labels.priority}
            value={noticePriorityLabel(notice.priority, locale)}
          />
          <div>
            <dt>{labels.responseStatus}</dt>
            <dd>
              <StatusBadge
                label={noticeResponseStatusLabel(
                  notice.response_status,
                  locale,
                )}
                tone={responseTone(notice.response_status)}
              />
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="notice-dates-title">
        <h2 id="notice-dates-title">{labels.dates}</h2>
        <dl className="notice-definition-list">
          <SummaryText
            label={labels.receivedDate}
            value={formatDate(notice.received_date, locale)}
          />
          <SummaryText
            label={labels.responseDeadline}
            value={formatDateTime(notice.response_deadline, locale)}
          />
          <SummaryText
            label={labels.openedOn}
            value={formatDate(notice.opened_on, locale)}
          />
          <SummaryText
            label={labels.closedOn}
            value={formatDate(notice.closed_on, locale)}
          />
          <SummaryText
            label={labels.archivedAt}
            value={
              notice.archived_at
                ? formatDateTime(notice.archived_at, locale)
                : labels.active
            }
          />
        </dl>
      </section>
      <section aria-labelledby="notice-links-title">
        <h2 id="notice-links-title">{labels.linkedRecords}</h2>
        <dl className="notice-definition-list">
          <div>
            <dt>{labels.linkedDeadline}</dt>
            <dd>
              <Link to={`/deadlines/${notice.linked_deadline_id}`}>
                <TechnicalValue>{notice.linked_deadline_id}</TechnicalValue>
              </Link>
            </dd>
          </div>
          <LinkedDeadlineState
            deadlineId={notice.linked_deadline_id}
            labels={labels}
            locale={locale}
          />
          <div>
            <dt>{labels.relatedMatters}</dt>
            <dd>
              <RelatedMatterLinks
                labels={labels}
                matterIds={notice.related_matter_ids}
              />
            </dd>
          </div>
          <SummaryText
            label={labels.ownerMembership}
            value={notice.owner_id}
            technical
          />
        </dl>
      </section>
      <section aria-labelledby="notice-description-title">
        <h2 id="notice-description-title">{labels.description}</h2>
        <p>{notice.description || labels.noDescription}</p>
      </section>
    </div>
  );
}

function LinkedDeadlineState({
  deadlineId,
  labels,
  locale,
}: {
  deadlineId: string;
  labels: ReturnType<typeof noticeText>;
  locale: ReturnType<typeof useI18n>["locale"];
}) {
  const query = useDeadlineDetail(deadlineId);

  if (query.isLoading) {
    return (
      <SummaryText
        label={labels.linkedDeadlineStatus}
        value={labels.loading}
      />
    );
  }
  if (query.isError || !query.data) {
    return (
      <SummaryText
        label={labels.linkedDeadlineStatus}
        value={labels.unavailableValue}
      />
    );
  }

  return (
    <>
      <div>
        <dt>{labels.linkedDeadlineStatus}</dt>
        <dd>
          <StatusBadge
            label={deadlineStatusLabel(query.data.status, locale)}
            tone={deadlineStatusTone(query.data.status)}
          />
        </dd>
      </div>
      <SummaryText
        label={labels.linkedDeadlineAssignee}
        value={query.data.assignee_id}
        technical
      />
    </>
  );
}

function RelatedMatterLinks({
  labels,
  matterIds,
}: {
  labels: ReturnType<typeof noticeText>;
  matterIds: string[];
}) {
  const query = useRelatedMatterLinks(matterIds);

  if (matterIds.length === 0) {
    return labels.none;
  }
  if (query.isLoading) {
    return labels.loadingRelatedMatters;
  }
  if (query.isError || !query.data || query.data.length === 0) {
    return labels.relatedNotVisible;
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
