import { Link } from "react-router-dom";

import {
  PaginatedTable,
  type TableColumn,
} from "../../../components/paginatedTable";
import { StatusBadge } from "../../../components/statusBadge";
import { TechnicalValue } from "../../../components/technicalValue";
import type { ContractListItem } from "../types";
import {
  contractPriorityLabel,
  contractStatusLabel,
  contractTypeLabel,
  lifecycleLabel,
  statusTone,
} from "./contractLabels";

const CONTRACT_COLUMNS: TableColumn<ContractListItem>[] = [
  {
    header: "Reference",
    key: "reference",
    render: (row) => (
      <Link to={`/contracts/${row.id}`}>
        <TechnicalValue>{row.reference_code}</TechnicalValue>
      </Link>
    ),
  },
  { header: "Title", key: "title", render: (row) => row.title },
  {
    header: "Counterparty",
    key: "counterparty",
    render: (row) => row.counterparty,
  },
  {
    header: "Type",
    key: "type",
    render: (row) => contractTypeLabel(row.contract_type),
  },
  {
    header: "Status",
    key: "status",
    render: (row) => (
      <StatusBadge
        label={contractStatusLabel(row.status)}
        tone={statusTone(row.status)}
      />
    ),
  },
  {
    header: "Priority",
    key: "priority",
    render: (row) => contractPriorityLabel(row.priority),
  },
  {
    header: "Date state",
    key: "date-state",
    render: (row) => lifecycleLabel(row),
  },
];

export function ContractListTable({
  page,
  pageCount,
  rows,
}: {
  page: number;
  pageCount: number;
  rows: ContractListItem[];
}) {
  return (
    <PaginatedTable
      caption="Contracts"
      columns={CONTRACT_COLUMNS}
      emptyLabel="No contracts match the current filters."
      getRowKey={(row) => row.id}
      pagination={{ page, pageCount }}
      rows={rows}
    />
  );
}
