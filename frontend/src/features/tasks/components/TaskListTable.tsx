import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n, type SupportedLocale } from "../../../i18n";
import type { TaskListItem } from "../types";
import {
  formatDateTime,
  taskStatusLabel,
  taskStatusTone,
  taskText,
} from "./taskLabels";

export function TaskListTable({
  caption,
  page,
  pageCount,
  rows,
}: {
  caption?: string;
  page: number;
  pageCount: number;
  rows: TaskListItem[];
}) {
  const { locale } = useI18n();
  const labels = taskText(locale);

  return (
    <PaginatedTable
      caption={caption ?? labels.listTitle}
      columns={taskColumns(locale)}
      emptyLabel={labels.empty}
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}

function taskColumns(locale: SupportedLocale): TableColumn<TaskListItem>[] {
  const labels = taskText(locale);
  return [
    {
      header: labels.title,
      key: "task",
      render: (row) => <Link to={`/tasks/${row.id}`}>{row.title}</Link>,
    },
    {
      header: labels.matter,
      key: "matter",
      render: (row) => <TechnicalValue>{row.matter_id}</TechnicalValue>,
    },
    {
      header: labels.assignee,
      key: "assignee",
      render: (row) => <TechnicalValue>{row.assignee_id}</TechnicalValue>,
    },
    {
      header: labels.due,
      key: "due",
      render: (row) => formatDateTime(row.due_at, locale),
    },
    {
      header: labels.status,
      key: "status",
      render: (row) => (
        <StatusBadge
          label={taskStatusLabel(row.status, locale)}
          tone={taskStatusTone(row.status)}
        />
      ),
    },
  ];
}
