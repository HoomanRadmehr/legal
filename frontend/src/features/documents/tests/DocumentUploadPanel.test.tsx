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

test("prechecks file type before initiating upload", async () => {
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

test("prechecks size before initiating upload", async () => {
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

test("initiates then uploads bytes directly to returned storage URL", async () => {
  const user = userEvent.setup();
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  const consoleLog = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);
  const consoleWarn = vi
    .spyOn(console, "warn")
    .mockImplementation(() => undefined);
  const storageSet = vi.spyOn(Storage.prototype, "setItem");
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/complete/")) {
      return Response.json(uploadSession({ status: "processing" }));
    }
    return Response.json(uploadInitiation());
  });
  const xhrRequests = installFakeXhr(204);
  vi.stubGlobal("fetch", fetchImpl);

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), pdfFile());

  expect(
    await screen.findByText("Server status: processing"),
  ).toBeInTheDocument();
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/documents/uploads/"),
    expect.objectContaining({ method: "POST" }),
  );
  expect(xhrRequests[0]).toMatchObject({
    method: "PUT",
    url: "https://minio.example.test/presigned",
  });
  expect(
    screen.getByText(/Server processing remains authoritative/i),
  ).toBeInTheDocument();
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/documents/uploads/upload-1/"),
    expect.objectContaining({ method: "GET" }),
  );
  expect(fetchImpl).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/documents/uploads/upload-1/complete/"),
    expect.objectContaining({ method: "POST" }),
  );
  expect(storageSet).not.toHaveBeenCalled();
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(consoleOutput(consoleError)).not.toContain("minio.example.test");
  expect(consoleOutput(consoleLog)).not.toContain("minio.example.test");
  expect(consoleOutput(consoleWarn)).not.toContain("minio.example.test");
});

test("shows rate limit retry guidance without exposing upload URL", async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "rate_limit_exceeded",
          details: {},
          message: "Too many uploads.",
        },
        { headers: { "Retry-After": "15" }, status: 429 },
      ),
    ),
  );
  const consoleLog = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);
  const storageSet = vi.spyOn(Storage.prototype, "setItem");

  renderUploadPanel();
  await user.upload(screen.getByLabelText("Select document"), pdfFile());

  expect(await screen.findByRole("alert")).toHaveTextContent("15 seconds");
  expect(screen.queryByText(/minio.example.test/)).not.toBeInTheDocument();
  expect(consoleLog).not.toHaveBeenCalled();
  expect(storageSet).not.toHaveBeenCalled();
});

function renderUploadPanel({
  role = "legal_admin",
}: {
  role?: string;
} = {}) {
  return renderWithProviders(
    <DocumentUploadPanel matterId="11111111-1111-1111-1111-111111111111" />,
    role,
  );
}

function renderWithProviders(children: ReactNode, role: string) {
  return render(
    <I18nProvider initialLocale="en">
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

function uploadInitiation() {
  return {
    instructions: {
      completion_url: "/api/v1/documents/uploads/upload-1/complete/",
      expires_at: "2027-07-14T10:10:00Z",
      fields: {},
      headers: { "Content-Type": "application/pdf" },
      method: "PUT",
      polling_url: "/api/v1/documents/uploads/upload-1/",
      url: "https://minio.example.test/presigned",
    },
    upload: {
      completed_at: null,
      created_at: "2027-07-14T10:00:00Z",
      description: "",
      expected_checksum: "",
      expected_content_type: "application/pdf",
      expected_size: 1024,
      expires_at: "2027-07-14T10:10:00Z",
      failure_code: "",
      id: "upload-1",
      matter_id: "matter-1",
      original_filename: "notice.pdf",
      requested_by_id: "membership-1",
      status: "initiated",
      updated_at: "2027-07-14T10:00:00Z",
    },
  };
}

function uploadSession({ status = "initiated" } = {}) {
  return {
    completed_at: null,
    created_at: "2027-07-14T10:00:00Z",
    description: "",
    expected_checksum: "",
    expected_content_type: "application/pdf",
    expected_size: 1024,
    expires_at: "2027-07-14T10:10:00Z",
    failure_code: "",
    id: "upload-1",
    matter_id: "matter-1",
    original_filename: "notice.pdf",
    requested_by_id: "membership-1",
    status,
    updated_at: "2027-07-14T10:00:00Z",
  };
}

type XhrCall = {
  method: string;
  url: string;
};

function installFakeXhr(status: number): XhrCall[] {
  const requests: XhrCall[] = [];

  class FakeXhr {
    status = status;
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
      onprogress: null,
    };
    method = "";
    url = "";
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }

    setRequestHeader() {
      return undefined;
    }

    send() {
      requests.push({ method: this.method, url: this.url });
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: 512,
        total: 1024,
      } as ProgressEvent);
      this.onload?.();
    }
  }

  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  return requests;
}

function consoleOutput(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.flat().join(" ");
}
