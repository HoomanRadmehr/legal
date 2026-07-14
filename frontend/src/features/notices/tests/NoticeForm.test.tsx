import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { NoticeForm } from "../components/NoticeForm";
import type { NoticeDetail, NoticeInput, NoticeUpdateInput } from "../types";
import { renderNoticeRoute, resetNoticeTestState } from "./testUtils";

afterEach(resetNoticeTestState);

test("validates response deadline against received date before submit", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: NoticeInput | NoticeUpdateInput) =>
    noticeDetail(input),
  );
  vi.stubGlobal("fetch", vi.fn(fetchRelatedMatterChoices));

  renderNoticeRoute({
    children: (
      <NoticeForm mode="create" mutationError={null} onSubmit={onSubmit} />
    ),
    path: "/",
    route: "/",
  });

  await fillRequiredFields(user, "2027-07-15", "2027-07-14T12:30");
  await user.click(screen.getByRole("button", { name: "Create notice" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Response deadline cannot precede received date.",
  );
  expect(onSubmit).not.toHaveBeenCalled();
});

test("submits ISO response deadline and visible related matter choices", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(async (input: NoticeInput | NoticeUpdateInput) =>
    noticeDetail(input),
  );
  vi.stubGlobal("fetch", vi.fn(fetchRelatedMatterChoices));

  renderNoticeRoute({
    children: (
      <NoticeForm mode="create" mutationError={null} onSubmit={onSubmit} />
    ),
    path: "/",
    route: "/",
  });

  expect(await screen.findByText("Visible litigation")).toBeInTheDocument();
  expect(screen.getByText("Visible NDA")).toBeInTheDocument();
  expect(screen.queryByText("Hidden litigation")).not.toBeInTheDocument();

  await user.click(screen.getByLabelText(/CASE-1/i));
  await fillRequiredFields(user, "2027-07-15", "2027-07-15T12:30");
  await user.click(screen.getByRole("button", { name: "Create notice" }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        related_matter_ids: [uuid("1")],
        response_deadline: expect.stringContaining("2027-07-15T"),
        title: "Agency notice",
      }),
    );
  });
});

async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  receivedDate: string,
  responseDeadline: string,
) {
  await user.type(screen.getByLabelText("Title"), "Agency notice");
  await user.type(screen.getByLabelText("Reference code"), "NOTICE-1");
  await user.type(screen.getByLabelText("Sender"), "Regulator");
  await user.type(screen.getByLabelText("Received date"), receivedDate);
  await user.type(screen.getByLabelText("Response deadline"), responseDeadline);
}

async function fetchRelatedMatterChoices(input: RequestInfo | URL) {
  const path = requestPath(input);
  if (path === "/api/v1/cases/") {
    return Response.json({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          archived_at: null,
          case_type: "litigation",
          created_at: "2027-01-01T10:00:00Z",
          id: uuid("1"),
          owner_id: uuid("8"),
          priority: "normal",
          reference_code: "CASE-1",
          status: "open",
          title: "Visible litigation",
          updated_at: "2027-01-01T10:00:00Z",
          version: 1,
        },
      ],
    });
  }
  if (path === "/api/v1/contracts/") {
    return Response.json({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          archived_at: null,
          contract_type: "nda",
          counterparty: "Vendor",
          created_at: "2027-01-01T10:00:00Z",
          effective_date: "2027-01-01",
          expiration_date: null,
          id: uuid("2"),
          owner_id: uuid("8"),
          priority: "normal",
          reference_code: "CON-1",
          renewal_date: null,
          status: "active",
          title: "Visible NDA",
          updated_at: "2027-01-01T10:00:00Z",
          version: 1,
        },
      ],
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

function noticeDetail(input: NoticeInput | NoticeUpdateInput): NoticeDetail {
  return {
    archived_at: null,
    closed_on: input.closed_on ?? null,
    created_at: "2027-01-01T10:00:00Z",
    description: input.description ?? "",
    id: "notice-1",
    linked_deadline_id: "deadline-1",
    opened_on: input.opened_on ?? null,
    owner_id: input.owner_id ?? uuid("8"),
    priority: input.priority ?? "normal",
    received_date: input.received_date ?? "2027-07-15",
    reference_code: input.reference_code ?? "NOTICE-1",
    related_matter_ids: input.related_matter_ids ?? [],
    response_deadline: input.response_deadline ?? "2027-07-15T12:30:00Z",
    response_status: input.response_status ?? "pending",
    sender: input.sender ?? "Regulator",
    status: input.status ?? "response_due",
    title: input.title ?? "Agency notice",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}

function uuid(suffix: string): string {
  return `11111111-1111-4111-8111-11111111111${suffix}`;
}
