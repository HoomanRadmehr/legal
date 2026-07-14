import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type PropsWithChildren, useState } from "react";
import { expect, test, vi } from "vitest";

import { I18nProvider } from "../i18n";
import { ConfirmationDialog } from "./confirmationDialog";
import { FormErrorSummary } from "./formErrorSummary";
import { PageHeader } from "./pageHeader";
import { PaginatedTable, type TableColumn } from "./paginatedTable";
import { StatusBadge } from "./statusBadge";
import { TechnicalValue } from "./technicalValue";

test("renders a domain-neutral page header and status badge", () => {
  renderWithI18n(
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Records"
        description="Review current records."
        actions={<button type="button">Create</button>}
      />
      <StatusBadge tone="success" />
    </>,
  );

  expect(screen.getByRole("heading", { name: "Records" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  expect(screen.getByText("Complete")).toBeInTheDocument();
});

test("renders a paginated table shell with rows and page status", () => {
  type Row = { id: string; owner: string; reference: string };
  const columns: TableColumn<Row>[] = [
    {
      header: "Reference",
      key: "reference",
      render: (row) => <TechnicalValue>{row.reference}</TechnicalValue>,
    },
    { align: "end", header: "Owner", key: "owner", render: (row) => row.owner },
  ];

  renderWithI18n(
    <PaginatedTable
      caption="Record list"
      columns={columns}
      getRowKey={(row) => row.id}
      pagination={{ page: 1, pageCount: 3 }}
      rows={[{ id: "1", owner: "Ava", reference: "CASE-2026-001" }]}
    />,
  );

  expect(
    screen.getByRole("table", { name: "Record list" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "Reference" }),
  ).toBeInTheDocument();
  expect(screen.getByText("CASE-2026-001")).toHaveAttribute("dir", "ltr");
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
});

test("renders a localized empty table message in RTL", () => {
  renderWithI18n(
    <PaginatedTable
      caption="فهرست"
      columns={[{ header: "نام", key: "name", render: () => "unused" }]}
      getRowKey={() => "none"}
      pagination={{ page: 1, pageCount: 1 }}
      rows={[]}
    />,
    { initialLocale: "fa" },
  );

  expect(document.documentElement.dir).toBe("rtl");
  expect(screen.getByText("رکوردی برای نمایش وجود ندارد.")).toBeInTheDocument();
});

test("renders a form error summary with field links", () => {
  renderWithI18n(
    <FormErrorSummary
      errors={[
        {
          fieldId: "title",
          label: "Title",
          message: "Required",
        },
      ]}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Please fix the following fields",
  );
  expect(screen.getByRole("link", { name: "Title: Required" })).toHaveAttribute(
    "href",
    "#title",
  );
});

test("confirmation dialog focuses cancel and returns focus", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();

  renderWithI18n(<DialogHarness onConfirm={onConfirm} />);

  const openButton = screen.getByRole("button", { name: "Open dialog" });
  openButton.focus();
  await user.click(openButton);

  expect(
    screen.getByRole("dialog", { name: "Archive record" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

  await user.click(screen.getByRole("button", { name: "Confirm" }));

  expect(onConfirm).toHaveBeenCalledOnce();
});

function DialogHarness({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <ConfirmationDialog
        onCancel={() => setOpen(false)}
        onConfirm={onConfirm}
        open={open}
        title="Archive record"
      >
        This action requires confirmation.
      </ConfirmationDialog>
    </>
  );
}

function renderWithI18n(
  children: React.ReactNode,
  options: { initialLocale?: "en" | "fa" } = {},
) {
  return render(
    <I18nProvider initialLocale={options.initialLocale ?? "en"}>
      <TestSurface>{children}</TestSurface>
    </I18nProvider>,
  );
}

function TestSurface({ children }: PropsWithChildren) {
  return <div>{children}</div>;
}
