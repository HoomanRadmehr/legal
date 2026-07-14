import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { CaseListItem } from "../types";
import {
  casePriorityLabel,
  caseStatusLabel,
  caseTypeLabel,
  statusTone,
} from "./caseLabels";

const CASE_COLUMNS: TableColumn<CaseListItem>[] = [
  {
    header: "Reference",
    key: "reference",
    render: (row) => (
      <Link to={`/cases/${row.id}`}>
        <TechnicalValue>{row.reference_code}</TechnicalValue>
      </Link>
    ),
  },
  { header: "Title", key: "title", render: (row) => row.title },
  {
    header: "Type",
    key: "type",
    render: (row) => caseTypeLabel(row.case_type),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => (
      <StatusBadge
        label={caseStatusLabel(row.status)}
        tone={statusTone(row.status)}
      />
    ),
  },
  {
    header: "Priority",
    key: "priority",
    render: (row) => casePriorityLabel(row.priority),
  },
];

export function CaseListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: CaseListItem[];
}) {
  return (
    <PaginatedTable
      caption="Cases"
      columns={CASE_COLUMNS}
      emptyLabel="No cases match the current filters."
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}
