import type { ReactNode } from "react";

import { useI18n } from "../i18n";

export type TableColumn<TRow> = {
  align?: "end" | "start";
  header: string;
  key: string;
  render: (row: TRow) => ReactNode;
};

export type TablePagination = {
  page: number;
  pageCount: number;
};

export function PaginatedTable<TRow>({
  caption,
  columns,
  emptyLabel,
  getRowKey,
  pagination,
  rows,
}: {
  caption: string;
  columns: TableColumn<TRow>[];
  emptyLabel?: string;
  getRowKey: (row: TRow) => string;
  pagination: TablePagination;
  rows: TRow[];
}) {
  const { t } = useI18n();
  const columnCount = Math.max(columns.length, 1);

  return (
    <div className="table-shell">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" data-align={column.align}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} data-align={column.align}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columnCount}>
                {emptyLabel ?? t("components.paginatedTable.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="table-shell__pagination" aria-live="polite">
        {t("components.paginatedTable.pageStatus", pagination)}
      </p>
    </div>
  );
}
