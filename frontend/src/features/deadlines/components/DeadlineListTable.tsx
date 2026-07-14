import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { DeadlineListItem } from "../types";
import {
  deadlinePriorityLabel,
  deadlineStatusLabel,
  formatDateTime,
  statusTone,
} from "./deadlineLabels";

const DEADLINE_COLUMNS: TableColumn<DeadlineListItem>[] = [
  {
    header: "Title",
    key: "title",
    render: (row) => <Link to={`/deadlines/${row.id}`}>{row.title}</Link>,
  },
  {
    header: "Due",
    key: "due",
    render: (row) => (
      <time dateTime={row.due_at}>{formatDateTime(row.due_at)}</time>
    ),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => (
      <StatusBadge
        label={deadlineStatusLabel(row.status)}
        tone={statusTone(row.status)}
      />
    ),
  },
  {
    header: "Priority",
    key: "priority",
    render: (row) => deadlinePriorityLabel(row.priority),
  },
  {
    header: "Matter",
    key: "matter",
    render: (row) => <TechnicalValue>{row.matter_id}</TechnicalValue>,
  },
];

export function DeadlineListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: DeadlineListItem[];
}) {
  return (
    <PaginatedTable
      caption="Deadlines"
      columns={DEADLINE_COLUMNS}
      emptyLabel="No deadlines match the current view and filters."
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}
