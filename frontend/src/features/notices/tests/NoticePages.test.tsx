import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { useDeadlineList } from "../../deadlines/hooks";
import { NoticeDetailPage } from "../pages/NoticeDetailPage";
import { NoticeEditPage } from "../pages/NoticeEditPage";
import { useUpdateNotice } from "../hooks";
import type { NoticeUpdateInput } from "../types";
import { renderNoticeRoute, resetNoticeTestState } from "./testUtils";

afterEach(resetNoticeTestState);

test("viewer notice detail is read-only", async () => {
  vi.stubGlobal("fetch", vi.fn(fetchNoticeDetailTimelineAndArchive));

  renderNoticeRoute({
    children: <NoticeDetailPage />,
    path: "/notices/:noticeId",
    role: "viewer",
    route: "/notices/notice-1",
  });

  expect(
    await screen.findByRole("heading", { name: "Agency notice" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("Open")).toBeInTheDocument();
  expect(screen.getByText("Visible litigation")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Edit notice" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Archive notice" }),
  ).not.toBeInTheDocument();
});

test("archive action uses confirmation and archive endpoint", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchNoticeDetailTimelineAndArchive);
  vi.stubGlobal("fetch", fetchImpl);

  renderNoticeRoute({
    children: <NoticeDetailPage />,
    path: "/notices/:noticeId",
    route: "/notices/notice-1",
  });

  await user.click(
    await screen.findByRole("button", { name: "Archive notice" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Archive notice" });
  expect(dialog).toHaveTextContent("not a delete");
  await user.click(
    within(dialog).getByRole("button", { name: "Archive notice" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/notices/notice-1/archive/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

test("shows version conflict without clearing edited input", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchNoticeConflictAndRelatedChoices));

  renderNoticeRoute({
    children: <NoticeEditPage />,
    path: "/notices/:noticeId/edit",
    route: "/notices/notice-1/edit",
  });

  const title = await screen.findByLabelText("Title");
  await user.clear(title);
  await user.type(title, "Edited notice title");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText(/changed while you were editing/i),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("Edited notice title")).toBeInTheDocument();
});

test("shows hidden relation errors as clear related matter guidance", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchNoticeHiddenRelationAndRelatedChoices));

  renderNoticeRoute({
    children: <NoticeEditPage />,
    path: "/notices/:noticeId/edit",
    route: "/notices/notice-1/edit",
  });

  await user.click(await screen.findByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText(/related matter was not found or is not visible/i),
  ).toBeInTheDocument();
});

test("successful notice updates refetch active deadline queries", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchNoticeUpdateAndDeadlineList);
  vi.stubGlobal("fetch", fetchImpl);

  renderNoticeRoute({ children: <NoticeUpdateProbe /> });

  await screen.findByText("Deadline requests 1");
  await user.click(screen.getByRole("button", { name: "Update notice" }));

  await waitFor(() => {
    expect(deadlineRequestCount(fetchImpl)).toBeGreaterThanOrEqual(2);
  });
});

function NoticeUpdateProbe() {
  const mutation = useUpdateNotice("notice-1");
  const deadlines = useDeadlineList({ view: "upcoming" });
  const input: NoticeUpdateInput = {
    received_date: "2027-07-15",
    response_deadline: "2027-07-16T12:30:00Z",
    version: 1,
  };

  return (
    <div>
      <p>Deadline requests {deadlines.data?.count ?? 0}</p>
      <button type="button" onClick={() => mutation.mutate(input)}>
        Update notice
      </button>
    </div>
  );
}

async function fetchNoticeDetailTimelineAndArchive(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/notices/notice-1/" && init?.method !== "PATCH") {
    return Response.json(noticeDetail());
  }
  if (path === "/api/v1/notices/notice-1/timeline/") {
    return Response.json([
      {
        action: "notice.created",
        actor_membership_id: uuid("8"),
        after_values: {},
        before_values: {},
        created_at: "2027-01-01T10:00:00Z",
        id: "event-1",
        metadata: {},
        target_id: "notice-1",
        target_type: "notice",
      },
    ]);
  }
  if (path === "/api/v1/deadlines/deadline-1/") {
    return Response.json(deadlineDetail());
  }
  if (path === `/api/v1/cases/${uuid("1")}/`) {
    return Response.json(caseDetail());
  }
  if (path === `/api/v1/contracts/${uuid("1")}/`) {
    return Response.json(
      { code: "not_found", details: {}, message: "Not found." },
      { status: 404 },
    );
  }
  if (path === "/api/v1/notices/notice-1/archive/" && init?.method === "POST") {
    return Response.json({
      ...noticeDetail(),
      archived_at: "2027-07-16T12:30:00Z",
      status: "archived",
      version: 2,
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchNoticeConflictAndRelatedChoices(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/notices/notice-1/" && init?.method !== "PATCH") {
    return Response.json(noticeDetail());
  }
  if (path === "/api/v1/notices/notice-1/" && init?.method === "PATCH") {
    return Response.json(
      {
        code: "notice_version_conflict",
        details: {},
        message: "Notice version conflict.",
      },
      { status: 409 },
    );
  }
  return fetchEmptyRelatedChoices(input);
}

async function fetchNoticeHiddenRelationAndRelatedChoices(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/notices/notice-1/" && init?.method !== "PATCH") {
    return Response.json(noticeDetail());
  }
  if (path === "/api/v1/notices/notice-1/" && init?.method === "PATCH") {
    return Response.json(
      {
        code: "not_found",
        details: {},
        message: "Not found.",
      },
      { status: 404 },
    );
  }
  return fetchEmptyRelatedChoices(input);
}

async function fetchNoticeUpdateAndDeadlineList(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/deadlines/") {
    return Response.json({
      count: 1,
      next: null,
      previous: null,
      results: [],
    });
  }
  if (path === "/api/v1/notices/notice-1/" && init?.method === "PATCH") {
    return Response.json({ ...noticeDetail(), version: 2 });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchEmptyRelatedChoices(input: RequestInfo | URL) {
  const path = requestPath(input);
  if (path === "/api/v1/cases/" || path === "/api/v1/contracts/") {
    return Response.json({ count: 0, next: null, previous: null, results: [] });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

function deadlineRequestCount(fetchImpl: ReturnType<typeof vi.fn>): number {
  return fetchImpl.mock.calls.filter((call) => {
    return requestPath(call[0]) === "/api/v1/deadlines/";
  }).length;
}

function noticeDetail() {
  return {
    archived_at: null,
    closed_on: null,
    created_at: "2027-01-01T10:00:00Z",
    description: "Review and respond.",
    id: "notice-1",
    linked_deadline_id: "deadline-1",
    opened_on: "2027-07-15",
    owner_id: uuid("8"),
    priority: "normal",
    received_date: "2027-07-15",
    reference_code: "NOTICE-1",
    related_matter_ids: [uuid("1")],
    response_deadline: "2027-07-16T12:30:00Z",
    response_status: "pending",
    sender: "Regulator",
    status: "response_due",
    title: "Agency notice",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function deadlineDetail() {
  return {
    assignee_id: uuid("7"),
    cancelled_at: null,
    cancelled_by_id: null,
    completed_at: null,
    completed_by_id: null,
    created_at: "2027-01-01T10:00:00Z",
    description: "Respond to agency notice.",
    due_at: "2027-07-16T12:30:00Z",
    id: "deadline-1",
    matter_id: "notice-1",
    priority: "normal",
    reminder_enabled: true,
    status: "open",
    title: "Respond to notice",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function caseDetail() {
  return {
    archived_at: null,
    case_type: "litigation",
    closed_on: null,
    court_or_authority: "Court",
    created_at: "2027-01-01T10:00:00Z",
    description: "Visible related case.",
    filing_date: null,
    id: uuid("1"),
    opened_on: "2027-01-01",
    outcome_summary: "",
    owner_id: uuid("8"),
    parties: [],
    priority: "normal",
    reference_code: "CASE-1",
    status: "open",
    title: "Visible litigation",
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
