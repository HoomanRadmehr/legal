import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { TaskListItem } from "../types";
import { formatDateTime, taskStatusLabel, taskStatusTone } from "./taskLabels";

const TASK_COLUMNS: TableColumn<TaskListItem>[] = [
  {
    header: "Task",
    key: "task",
    render: (row) => <Link to={`/tasks/${row.id}`}>{row.title}</Link>,
  },
  {
    header: "Matter",
    key: "matter",
    render: (row) => <TechnicalValue>{row.matter_id}</TechnicalValue>,
  },
  {
    header: "Assignee",
    key: "assignee",
    render: (row) => <TechnicalValue>{row.assignee_id}</TechnicalValue>,
  },
  {
    header: "Due",
    key: "due",
    render: (row) => formatDateTime(row.due_at),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => (
      <StatusBadge
        label={taskStatusLabel(row.status)}
        tone={taskStatusTone(row.status)}
      />
    ),
  },
];

export function TaskListTable({
  caption = "Tasks",
  page,
  pageCount,
  rows,
}: {
  caption?: string;
  page: number;
  pageCount: number;
  rows: TaskListItem[];
}) {
  return (
    <PaginatedTable
      caption={caption}
      columns={TASK_COLUMNS}
      emptyLabel="No tasks match the current filters."
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}
