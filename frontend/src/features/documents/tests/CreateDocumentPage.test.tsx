import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { CreateDocumentPage } from "../pages/CreateDocumentPage";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("viewer direct navigation is denied safely", () => {
  renderCreatePage({ role: "viewer" });

  expect(screen.getByRole("alert")).toHaveTextContent(
    "You do not have permission to upload documents.",
  );
});

test("loads searchable matter choices and fetches the next cursor page", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchForChoices);
  vi.stubGlobal("fetch", fetchImpl);

  renderCreatePage();
  await user.click(
    screen.getByRole("combobox", { name: "Search legal matters" }),
  );

  expect(await screen.findByText("Alpha case")).toBeInTheDocument();
  await user.type(screen.getByRole("combobox"), "beta");
  expect(await screen.findByText("Beta contract")).toBeInTheDocument();

  const list = screen.getByRole("listbox").parentElement as HTMLElement;
  Object.defineProperties(list, {
    clientHeight: { value: 100 },
    scrollHeight: { value: 120 },
    scrollTop: { value: 20 },
  });
  fireEvent.scroll(list);

  await waitFor(() =>
    expect(fetchCalls(fetchImpl).join(" ")).toContain("cursor=cursor-2"),
  );
});

test("validates matter, file, type and file removal", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn(fetchForChoices));

  renderCreatePage();
  await user.click(screen.getByRole("button", { name: "Upload document" }));
  expect(
    await screen.findByText("Legal matter is required."),
  ).toBeInTheDocument();
  expect(screen.getByText("File is required.")).toBeInTheDocument();

  await pickFirstMatter(user);
  fireEvent.change(screen.getByLabelText("Select file"), {
    target: {
      files: [
        new File(["bad"], "script.exe", {
          type: "application/x-msdownload",
        }),
      ],
    },
  });
  await user.click(screen.getByRole("button", { name: "Upload document" }));
  expect(
    await screen.findByText("This file type is not allowed."),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Select file"), {
    target: { files: [pdfFile()] },
  });
  expect(await screen.findByText("notice.pdf")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove file" }));
  expect(screen.queryByText("notice.pdf")).not.toBeInTheDocument();
});

test("uploads directly to MinIO and sends only approved metadata to Django", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(fetchForSuccessfulUpload);
  const xhrRequests = installFakeXhr(204);
  const storageSet = vi.spyOn(Storage.prototype, "setItem");
  vi.stubGlobal("fetch", fetchImpl);

  renderCreatePage();
  await pickFirstMatter(user);
  await user.upload(screen.getByLabelText("Select file"), pdfFile());
  await user.type(screen.getByLabelText("Description"), "Signed notice");
  await user.click(screen.getByRole("button", { name: "Upload document" }));

  expect(
    await screen.findByText("The document is available."),
  ).toBeInTheDocument();
  const presign = requestBody(fetchImpl, "/documents/presign/");
  expect(presign).toMatchObject({
    content_type: "application/pdf",
    description: "Signed notice",
    filename: "notice.pdf",
    matter_id: "matter-1",
    size: 1024,
  });
  expect(JSON.stringify(presign)).not.toContain("organization_id");
  expect(JSON.stringify(presign)).not.toContain("object_key");
  expect(JSON.stringify(presign)).not.toContain("bucket");
  expect(xhrRequests[0]).toMatchObject({
    method: "PUT",
    url: "https://minio.example.test/presigned",
    withCredentials: false,
  });
  expect(xhrRequests[0]?.headers.Authorization).toBeUndefined();
  expect(xhrRequests[0]?.headers.Cookie).toBeUndefined();
  expect(requestBody(fetchImpl, "/complete/")).toEqual({});
  expect(storageSet).not.toHaveBeenCalled();
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
});

test("renders Persian upload labels", () => {
  vi.stubGlobal("fetch", vi.fn(fetchForChoices));

  renderCreatePage({ locale: "fa" });

  expect(screen.getByRole("heading", { name: "سند جدید" })).toBeInTheDocument();
  expect(screen.getByLabelText("انتخاب فایل")).toBeInTheDocument();
  expect(screen.getByLabelText("جستجوی رکوردهای حقوقی")).toBeInTheDocument();
});

async function pickFirstMatter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("combobox", { name: "Search legal matters" }),
  );
  await user.click(await screen.findByRole("button", { name: /Alpha case/ }));
}

function renderCreatePage({
  locale = "en",
  role = "legal_admin",
}: {
  locale?: "en" | "fa";
  role?: string;
} = {}) {
  return render(
    <I18nProvider initialLocale={locale}>
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          <MemoryRouter>
            <CreateDocumentPage />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

function authContext(role: string): AuthContextValue {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    session: {
      access: "access-token",
      membership: {
        organization_id: "org-1",
        organization_name: "Acme Legal",
        role,
      },
      user: {
        display_name: "Ava Counsel",
        id: "user-1",
        preferred_language: "en",
      },
    },
    status: "authenticated",
  };
}

async function fetchForChoices(input: RequestInfo | URL) {
  const url = new URL(String(input));
  if (
    url.pathname.endsWith("/matters/choices/") &&
    url.searchParams.get("cursor")
  ) {
    return Response.json(
      choicePage([{ id: "matter-3", label: "Gamma notice" }]),
    );
  }
  if (url.searchParams.get("q") === "beta") {
    return Response.json(
      choicePage([{ id: "matter-2", label: "Beta contract" }], "cursor-2"),
    );
  }
  return Response.json(
    choicePage([{ id: "matter-1", label: "Alpha case" }], "cursor-2"),
  );
}

async function fetchForSuccessfulUpload(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const path = new URL(String(input)).pathname;
  if (path.endsWith("/matters/choices/")) {
    return Response.json(choicePage([{ id: "matter-1", label: "Alpha case" }]));
  }
  if (path.endsWith("/documents/presign/")) {
    return Response.json(presignResponse());
  }
  if (path.endsWith("/documents/document-1/complete/")) {
    return Response.json(documentSummary());
  }
  return Response.json({}, { status: init?.method === "POST" ? 200 : 404 });
}

function choicePage(
  choices: { id: string; label: string }[],
  nextCursor: string | null = null,
) {
  return {
    has_more: Boolean(nextCursor),
    next_cursor: nextCursor,
    results: choices.map((choice) => ({
      id: choice.id,
      kind: "case",
      label: choice.label,
      secondary_label: `${choice.id.toUpperCase()}-REF`,
    })),
  };
}

function pdfFile(): File {
  return new File(["x".repeat(1024)], "notice.pdf", {
    type: "application/pdf",
  });
}

function presignResponse() {
  return {
    document: {
      filename: "notice.pdf",
      id: "document-1",
      status: "pending_upload",
      upload_expires_at: "2027-07-14T10:10:00Z",
    },
    upload: {
      expires_at: "2027-07-14T10:10:00Z",
      headers: {
        Authorization: "Bearer should-not-leak",
        Cookie: "refresh=secret",
        "Content-Type": "application/pdf",
      },
      method: "PUT",
      url: "https://minio.example.test/presigned",
    },
  };
}

function documentSummary() {
  return {
    content_type: "application/pdf",
    filename: "notice.pdf",
    id: "document-1",
    size: 1024,
    status: "available",
    uploaded_at: "2027-07-14T10:05:00Z",
  };
}

type XhrCall = {
  bodyType: string;
  headers: Record<string, string>;
  method: string;
  url: string;
  withCredentials: boolean;
};

function installFakeXhr(status: number): XhrCall[] {
  const requests: XhrCall[] = [];

  class FakeXhr {
    headers: Record<string, string> = {};
    onabort: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    onloadend: (() => void) | null = null;
    status = status;
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
      onprogress: null,
    };
    method = "";
    url = "";
    withCredentials = true;

    abort() {
      this.onabort?.();
      this.onloadend?.();
    }

    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }

    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }

    send(body: BodyInit) {
      requests.push({
        bodyType: body.constructor.name,
        headers: this.headers,
        method: this.method,
        url: this.url,
        withCredentials: this.withCredentials,
      });
      this.upload.onprogress?.(progressEvent(1024, 1024));
      this.onload?.();
      this.onloadend?.();
    }
  }

  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  return requests;
}

function progressEvent(loaded: number, total: number): ProgressEvent {
  return { lengthComputable: true, loaded, total } as ProgressEvent;
}

function fetchCalls(fetchImpl: ReturnType<typeof vi.fn>): string[] {
  return fetchImpl.mock.calls.map((call) => String(call[0]));
}

function requestBody(fetchImpl: ReturnType<typeof vi.fn>, path: string) {
  const call = fetchImpl.mock.calls.find(([input]) =>
    String(input).includes(path),
  );
  expect(call).toBeDefined();
  return JSON.parse(
    String((call?.[1] as RequestInit | undefined)?.body ?? "{}"),
  );
}
