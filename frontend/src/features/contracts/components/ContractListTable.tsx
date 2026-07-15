import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import { useI18n } from "../../../i18n";
import type { ContractListItem } from "../types";
import {
  contractPriorityLabel,
  contractStatusLabel,
  contractText,
  contractTypeLabel,
  lifecycleLabel,
  statusTone,
} from "./contractLabels";

export function ContractListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: ContractListItem[];
}) {
  const { locale } = useI18n();
  const labels = contractText(locale);

  return (
    <PaginatedTable
      caption={labels.listTitle}
      columns={contractColumns(locale)}
      emptyLabel={labels.tableEmpty}
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}

function contractColumns(
  locale: ReturnType<typeof useI18n>["locale"],
): TableColumn<ContractListItem>[] {
  const labels = contractText(locale);
  return [
    {
      header: labels.reference,
      key: "reference",
      render: (row) => (
        <Link to={`/contracts/${row.id}`}>
          <TechnicalValue>{row.reference_code}</TechnicalValue>
        </Link>
      ),
    },
    { header: labels.title, key: "title", render: (row) => row.title },
    {
      header: labels.counterparty,
      key: "counterparty",
      render: (row) => row.counterparty,
    },
    {
      header: labels.type,
      key: "type",
      render: (row) => contractTypeLabel(row.contract_type, locale),
    },
    {
      header: labels.status,
      key: "status",
      render: (row) => (
        <StatusBadge
          label={contractStatusLabel(row.status, locale)}
          tone={statusTone(row.status)}
        />
      ),
    },
    {
      header: labels.priority,
      key: "priority",
      render: (row) => contractPriorityLabel(row.priority, locale),
    },
    {
      header: labels.dateState,
      key: "date-state",
      render: (row) => lifecycleLabel(row, locale),
    },
  ];
}
