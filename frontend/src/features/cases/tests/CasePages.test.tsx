import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { CaseDetailPage } from "../pages/CaseDetailPage";
import { CaseEditPage } from "../pages/CaseEditPage";
import { CaseListPage } from "../pages/CaseListPage";
import { renderCaseRoute, resetCaseTestState } from "./testUtils";

afterEach(resetCaseTestState);

test("renders list filters and read query results", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(caseListResponse())),
  );

  renderCaseRoute({
    children: <CaseListPage />,
    route: "/cases?status=open&case_type=litigation",
  });

  expect(
    await screen.findByRole("table", { name: "Cases" }),
  ).toBeInTheDocument();
  expect(screen.getByText("CASE-2027-001")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Open")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Litigation")).toBeInTheDocument();
});

test("viewer detail is read-only and timeline uses safe labels", async () => {
  vi.stubGlobal("fetch", vi.fn(fetchCaseDetailAndTimeline));

  renderCaseRoute({
    children: <CaseDetailPage />,
    path: "/cases/:caseId",
    role: "viewer",
    route: "/cases/case-1",
  });

  expect(
    await screen.findByRole("heading", { name: "Employment dispute" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Edit case" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Archive case" }),
  ).not.toBeInTheDocument();
  expect(await screen.findByText("Case created")).toBeInTheDocument();
  expect(screen.queryByText("case.created")).not.toBeInTheDocument();
});

test("archive requires confirmation and does not present delete wording", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchCaseDetailAndTimeline);
  vi.stubGlobal("fetch", fetchImpl);

  renderCaseRoute({
    children: <CaseDetailPage />,
    path: "/cases/:caseId",
    route: "/cases/case-1",
  });

  await user.click(await screen.findByRole("button", { name: "Archive case" }));
  const dialog = screen.getByRole("dialog", { name: "Archive case" });
  expect(dialog).toHaveTextContent("not a delete");
  await user.click(
    within(dialog).getByRole("button", { name: "Archive case" }),
  );

  await waitFor(() => {
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/cases/case-1/archive/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

test("version conflict is shown without clearing edited input", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchCaseConflictFlow));

  renderCaseRoute({
    children: <CaseEditPage />,
    path: "/cases/:caseId/edit",
    route: "/cases/case-1/edit",
  });

  const title = await screen.findByLabelText("Title");
  await user.clear(title);
  await user.type(title, "Updated title");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText(/changed while you were editing/i),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("Updated title")).toBeInTheDocument();
});

async function fetchCaseDetailAndTimeline(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/cases/case-1/") {
    return Response.json(caseDetail());
  }
  if (path === "/api/v1/cases/case-1/timeline/") {
    return Response.json([
      {
        action: "case.created",
        actor_membership_id: "member-1",
        after_values: {},
        before_values: {},
        created_at: "2027-01-01T10:00:00Z",
        id: "event-1",
        metadata: {},
        target_id: "case-1",
        target_type: "matter",
      },
    ]);
  }
  if (path === "/api/v1/cases/case-1/archive/" && init?.method === "POST") {
    return Response.json({
      ...caseDetail(),
      archived_at: "2027-01-02T10:00:00Z",
    });
  }
  return Response.json({ detail: "Unexpected request" }, { status: 500 });
}

async function fetchCaseConflictFlow(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = requestPath(input);
  if (path === "/api/v1/cases/case-1/" && init?.method !== "PATCH") {
    return Response.json(caseDetail());
  }
  if (path === "/api/v1/cases/case-1/" && init?.method === "PATCH") {
    return Response.json(
      {
        code: "case_version_conflict",
        details: {},
        message: "Case version conflict.",
      },
      { status: 409 },
    );
  }
  return Response.json([], { status: 200 });
}

function caseListResponse() {
  return { count: 1, next: null, previous: null, results: [caseListItem()] };
}

function caseListItem() {
  return {
    archived_at: null,
    case_type: "litigation",
    created_at: "2027-01-01T10:00:00Z",
    id: "case-1",
    owner_id: "11111111-1111-4111-8111-111111111111",
    priority: "normal",
    reference_code: "CASE-2027-001",
    status: "open",
    title: "Employment dispute",
    updated_at: "2027-01-01T10:00:00Z",
    version: 1,
  };
}

function caseDetail() {
  return {
    ...caseListItem(),
    closed_on: null,
    court_or_authority: "Labor Court",
    description: "Case description",
    filing_date: "2027-01-02",
    opened_on: "2027-01-01",
    outcome_summary: "",
    parties: [
      {
        contact_summary: "",
        id: "party-1",
        name: "Client Ltd",
        role: "client",
      },
    ],
  };
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url).pathname;
}
