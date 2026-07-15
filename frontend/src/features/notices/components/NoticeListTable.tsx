import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { SupportedLocale } from "../../../i18n";
import type { NoticeListItem } from "../types";
import {
  formatDateTime,
  noticeResponseStatusLabel,
  noticeStatusLabel,
  noticeText,
  responseTone,
  statusTone,
} from "./noticeLabels";

export function NoticeListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: NoticeListItem[];
}) {
  const { locale } = useI18n();
  const labels = noticeText(locale);

  return (
    <PaginatedTable
      caption={labels.caption}
      columns={noticeColumns(locale, labels)}
      emptyLabel={labels.empty}
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}

function noticeColumns(
  locale: SupportedLocale,
  labels: ReturnType<typeof noticeText>,
): TableColumn<NoticeListItem>[] {
  return [
    {
      header: labels.reference,
      key: "reference",
      render: (row) => (
        <Link to={`/notices/${row.id}`}>
          <TechnicalValue>{row.reference_code}</TechnicalValue>
        </Link>
      ),
    },
    { header: labels.title, key: "title", render: (row) => row.title },
    { header: labels.sender, key: "sender", render: (row) => row.sender },
    {
      header: labels.status,
      key: "status",
      render: (row) => (
        <StatusBadge
          label={noticeStatusLabel(row.status, locale)}
          tone={statusTone(row.status)}
        />
      ),
    },
    {
      header: labels.response,
      key: "response",
      render: (row) => (
        <StatusBadge
          label={noticeResponseStatusLabel(row.response_status, locale)}
          tone={responseTone(row.response_status)}
        />
      ),
    },
    {
      header: labels.responseDeadline,
      key: "response-deadline",
      render: (row) => (
        <time dateTime={row.response_deadline}>
          {formatDateTime(row.response_deadline, locale)}
        </time>
      ),
    },
  ];
}
