import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n, type SupportedLocale } from "../../../i18n";
import type { DeadlineListItem } from "../types";
import {
  deadlinePriorityLabel,
  deadlineStatusLabel,
  deadlineText,
  formatDateTime,
  statusTone,
} from "./deadlineLabels";

export function DeadlineListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: DeadlineListItem[];
}) {
  const { locale } = useI18n();
  const labels = deadlineText(locale);

  return (
    <PaginatedTable
      caption={labels.listTitle}
      columns={deadlineColumns(locale)}
      emptyLabel={labels.empty}
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}

function deadlineColumns(
  locale: SupportedLocale,
): TableColumn<DeadlineListItem>[] {
  const labels = deadlineText(locale);
  return [
    {
      header: labels.title,
      key: "title",
      render: (row) => <Link to={`/deadlines/${row.id}`}>{row.title}</Link>,
    },
    {
      header: labels.due,
      key: "due",
      render: (row) => (
        <time dateTime={row.due_at}>{formatDateTime(row.due_at, locale)}</time>
      ),
    },
    {
      header: labels.status,
      key: "status",
      render: (row) => (
        <StatusBadge
          label={deadlineStatusLabel(row.status, locale)}
          tone={statusTone(row.status)}
        />
      ),
    },
    {
      header: labels.priority,
      key: "priority",
      render: (row) => deadlinePriorityLabel(row.priority, locale),
    },
    {
      header: labels.matter,
      key: "matter",
      render: (row) => <TechnicalValue>{row.matter_id}</TechnicalValue>,
    },
  ];
}
