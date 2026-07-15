import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { createAppQueryClient } from "../../../app/queryClient";
import type { AuthContextValue } from "../../../auth/context";
import { AuthContext } from "../../../auth/context";
import { I18nProvider } from "../../../i18n";
import { DocumentUploadPanel } from "../components/DocumentUploadPanel";
import { MAX_UPLOAD_SIZE_BYTES } from "../policy";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("viewer has no upload control", () => {
  renderUploadPanel({ role: "viewer" });

  expect(
    screen.queryByRole("heading", { name: "Upload document" }),
  ).not.toBeInTheDocument();
});

test("prechecks file type before requesting presign", async () => {
  const fetchImpl = vi.fn();
  vi.stubGlobal("fetch", fetchImpl);

  renderUploadPanel();
  fireEvent.change(screen.getByLabelText("Select document"), {
    target: {
      files: [
        new File(["bad"], "script.exe", { type: "application/x-msdownload" }),
      ],
    },
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This file type is not allowed.",
  );
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("prechecks size before requesting presign", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn();
  vi.stubGlobal("fetch", fetchImpl);
  const file = new File(["x"], "large.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "size", { value: MAX_UPLOAD_SIZE_BYTES + 1 });

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), file);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "larger than the upload limit",
  );
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("uploads bytes to MinIO then completes and polls document state", async () => {
  const user = userEvent.setup();
  const consoleLog = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);
  const storageSet = vi.spyOn(Storage.prototype, "setItem");
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/complete/")) {
      return Response.json(documentSummary("verifying"));
    }
    if (String(input).includes("/documents/document-1/")) {
      return Response.json(documentRecord("available"));
    }
    return Response.json(presignResponse());
  });
  const xhrRequests = installFakeXhr(204);
  vi.stubGlobal("fetch", fetchImpl);

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), pdfFile());

  expect(
    await screen.findByText("Server status: Available"),
  ).toBeInTheDocument();
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/documents/presign/"),
    expect.objectContaining({ method: "POST" }),
  );
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/documents/document-1/complete/"),
    expect.objectContaining({ method: "POST" }),
  );
  expect(xhrRequests[0]).toMatchObject({
    method: "PUT",
    url: "https://minio.example.test/presigned",
    withCredentials: false,
  });
  expect(storageSet).not.toHaveBeenCalled();
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(consoleOutput(consoleLog)).not.toContain("minio.example.test");
});

test("does not complete when direct MinIO upload fails", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async () => Response.json(presignResponse()));
  vi.stubGlobal("fetch", fetchImpl);
  installFakeXhr(403);

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), pdfFile());

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "upload URL expired",
  );
  expect(fetchCalls(fetchImpl).join(" ")).not.toContain("/complete/");
});

test("retries complete without re-uploading after temporary complete failure", async () => {
  const user = userEvent.setup();
  let completeAttempts = 0;
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/complete/")) {
      completeAttempts += 1;
      if (completeAttempts === 1) {
        return apiError("upload_object_missing", 409);
      }
      return Response.json(documentSummary("available"));
    }
    return Response.json(presignResponse());
  });
  const xhrRequests = installFakeXhr(204);
  vi.stubGlobal("fetch", fetchImpl);

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), pdfFile());
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: "Retry" }));

  expect(await screen.findByText("Available")).toBeInTheDocument();
  expect(xhrRequests).toHaveLength(1);
  expect(
    fetchCalls(fetchImpl).filter((path) => path.includes("/complete/")),
  ).toHaveLength(2);
});

test("cancels an active browser upload", async () => {
  const user = userEvent.setup();
  const fetchImpl = vi.fn(async () => Response.json(presignResponse()));
  const xhrRequests = installPendingXhr();
  vi.stubGlobal("fetch", fetchImpl);

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), pdfFile());
  await user.click(await screen.findByRole("button", { name: "Cancel" }));

  expect(await screen.findByText("Cancelled")).toBeInTheDocument();
  expect(xhrRequests[0]?.aborted).toBe(true);
});

test("renders Persian upload labels", () => {
  renderUploadPanel({ locale: "fa" });

  expect(screen.getByLabelText("انتخاب سند")).toBeInTheDocument();
  expect(screen.getByText("بارگذاری سند")).toBeInTheDocument();
});

function renderUploadPanel({
  locale = "en",
  role = "legal_admin",
}: {
  locale?: "en" | "fa";
  role?: string;
} = {}) {
  return renderWithProviders(
    <DocumentUploadPanel matterId="11111111-1111-1111-1111-111111111111" />,
    role,
    locale,
  );
}

function renderWithProviders(
  children: ReactNode,
  role: string,
  locale: "en" | "fa",
) {
  return render(
    <I18nProvider initialLocale={locale}>
      <AuthContext.Provider value={authContext(role)}>
        <QueryClientProvider client={createAppQueryClient()}>
          {children}
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
      headers: { "Content-Type": "application/pdf" },
      method: "PUT",
      url: "https://minio.example.test/presigned",
    },
  };
}

function documentSummary(status = "available") {
  return {
    content_type: "application/pdf",
    filename: "notice.pdf",
    id: "document-1",
    size: 1024,
    status,
    uploaded_at: status === "available" ? "2027-07-14T10:05:00Z" : null,
  };
}

function documentRecord(status = "available") {
  return {
    actual_checksum: "",
    content_type: "application/pdf",
    created_at: "2027-07-14T10:00:00Z",
    description: "",
    etag: "etag",
    expected_checksum: "",
    expected_size: 1024,
    failure_code: "",
    id: "document-1",
    matter_id: "matter-1",
    original_filename: "notice.pdf",
    size: status === "available" ? 1024 : null,
    status,
    updated_at: "2027-07-14T10:05:00Z",
    upload_expires_at: "2027-07-14T10:10:00Z",
    uploaded_at: status === "available" ? "2027-07-14T10:05:00Z" : null,
    uploaded_by_id: "membership-1",
  };
}

function apiError(code: string, status: number): Response {
  return Response.json(
    { code, details: {}, message: "Temporary verification failure." },
    { status },
  );
}

type XhrCall = {
  aborted?: boolean;
  method: string;
  url: string;
  withCredentials: boolean;
};

function installFakeXhr(status: number): XhrCall[] {
  const requests: XhrCall[] = [];

  class FakeXhr {
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

    setRequestHeader() {
      return undefined;
    }

    send() {
      requests.push({
        method: this.method,
        url: this.url,
        withCredentials: this.withCredentials,
      });
      this.upload.onprogress?.(progressEvent(512, 1024));
      this.onload?.();
      this.onloadend?.();
    }
  }

  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  return requests;
}

function installPendingXhr(): XhrCall[] {
  const requests: XhrCall[] = [];

  class FakeXhr {
    onabort: (() => void) | null = null;
    onloadend: (() => void) | null = null;
    status = 0;
    upload = { onprogress: null };
    method = "";
    url = "";
    withCredentials = true;

    abort() {
      const request = requests[0];
      if (request) {
        request.aborted = true;
      }
      this.onabort?.();
      this.onloadend?.();
    }

    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }

    setRequestHeader() {
      return undefined;
    }

    send() {
      requests.push({
        method: this.method,
        url: this.url,
        withCredentials: this.withCredentials,
      });
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

function consoleOutput(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.flat().join(" ");
}
