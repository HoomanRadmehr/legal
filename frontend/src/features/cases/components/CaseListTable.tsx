import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { CaseListItem } from "../types";
import {
  casePriorityLabel,
  caseStatusLabel,
  caseText,
  caseTypeLabel,
  statusTone,
} from "./caseLabels";

export function CaseListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: CaseListItem[];
}) {
  const { locale } = useI18n();
  const labels = caseText(locale);

  return (
    <PaginatedTable
      caption={labels.tableTitle}
      columns={caseColumns(locale)}
      emptyLabel={labels.tableEmpty}
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}

function caseColumns(
  locale: ReturnType<typeof useI18n>["locale"],
): TableColumn<CaseListItem>[] {
  const labels = caseText(locale);
  return [
    {
      header: labels.reference,
      key: "reference",
      render: (row) => (
        <Link to={`/cases/${row.id}`}>
          <TechnicalValue>{row.reference_code}</TechnicalValue>
        </Link>
      ),
    },
    { header: labels.title, key: "title", render: (row) => row.title },
    {
      header: labels.type,
      key: "type",
      render: (row) => caseTypeLabel(row.case_type, locale),
    },
    {
      header: labels.status,
      key: "status",
      render: (row) => (
        <StatusBadge
          label={caseStatusLabel(row.status, locale)}
          tone={statusTone(row.status)}
        />
      ),
    },
    {
      header: labels.priority,
      key: "priority",
      render: (row) => casePriorityLabel(row.priority, locale),
    },
  ];
}
