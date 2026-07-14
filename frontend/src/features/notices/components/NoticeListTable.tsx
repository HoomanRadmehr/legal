import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { NoticeListItem } from "../types";
import {
  formatDateTime,
  noticeResponseStatusLabel,
  noticeStatusLabel,
  responseTone,
  statusTone,
} from "./noticeLabels";

const NOTICE_COLUMNS: TableColumn<NoticeListItem>[] = [
  {
    header: "Reference",
    key: "reference",
    render: (row) => (
      <Link to={`/notices/${row.id}`}>
        <TechnicalValue>{row.reference_code}</TechnicalValue>
      </Link>
    ),
  },
  { header: "Title", key: "title", render: (row) => row.title },
  { header: "Sender", key: "sender", render: (row) => row.sender },
  {
    header: "Status",
    key: "status",
    render: (row) => (
      <StatusBadge
        label={noticeStatusLabel(row.status)}
        tone={statusTone(row.status)}
      />
    ),
  },
  {
    header: "Response",
    key: "response",
    render: (row) => (
      <StatusBadge
        label={noticeResponseStatusLabel(row.response_status)}
        tone={responseTone(row.response_status)}
      />
    ),
  },
  {
    header: "Response deadline",
    key: "response-deadline",
    render: (row) => (
      <time dateTime={row.response_deadline}>
        {formatDateTime(row.response_deadline)}
      </time>
    ),
  },
];

export function NoticeListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: NoticeListItem[];
}) {
  return (
    <PaginatedTable
      caption="Legal notices"
      columns={NOTICE_COLUMNS}
      emptyLabel="No notices match the current filters."
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}
