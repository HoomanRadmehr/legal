import { afterEach, describe, expect, test, vi } from "vitest";

import {
  completeDocumentUpload,
  initiateDocumentUpload,
  requestDocumentDownloadUrl,
  uploadFileToStorage,
} from "../api";
import type { DocumentUploadInstructions } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("document upload API", () => {
  test("initiates upload through Django API without retrying the write", async () => {
    const fetchImpl = vi.fn(async () => Response.json(flatUploadInitiation()));
    vi.stubGlobal("fetch", fetchImpl);

    const result = await initiateDocumentUpload({
      content_type: "application/pdf",
      filename: "notice.pdf",
      matter_id: "matter-1",
      size: 1024,
    });

    expect(result.upload.id).toBe("upload-1");
    expect(result.instructions.completion_url).toContain("/complete/");
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/documents/uploads/"),
      expect.objectContaining({
        body: JSON.stringify({
          content_type: "application/pdf",
          filename: "notice.pdf",
          matter_id: "matter-1",
          size: 1024,
        }),
        method: "POST",
      }),
    );
  });

  test("completes upload with the stable idempotency key", async () => {
    const fetchImpl = vi.fn(async () => Response.json(uploadSession()));
    vi.stubGlobal("fetch", fetchImpl);

    await completeDocumentUpload({
      idempotencyKey: "idem-1",
      uploadId: "upload-1",
    });

    const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
    const init = calls[0]?.[1];
    expect(init).toBeDefined();
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/documents/uploads/upload-1/complete/"),
      expect.objectContaining({ method: "POST" }),
    );
    expect((init?.headers as Headers).get("Idempotency-Key")).toBe("idem-1");
  });

  test("requests a fresh download URL through Django API", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        expires_in_seconds: 120,
        url: "https://minio.example.test/download",
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const result = await requestDocumentDownloadUrl("document-1");

    expect(result.url).toContain("download");
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/documents/document-1/download-url/"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("uploads PUT bytes to the exact presigned URL with returned headers", async () => {
    const requests = installFakeXhr(204);
    const progress: number[] = [];

    await uploadFileToStorage({
      file: uploadFile(),
      instructions: uploadInstructions({ method: "PUT" }),
      onProgress: (event) => progress.push(event.percent),
    });

    expect(requests[0]).toMatchObject({
      bodyType: "File",
      headers: { "Content-Type": "application/pdf" },
      method: "PUT",
      url: "https://minio.example.test/presigned",
    });
    expect(progress).toEqual([50, 100]);
  });

  test("uploads POST form fields exactly as returned", async () => {
    const requests = installFakeXhr(204);

    await uploadFileToStorage({
      file: uploadFile(),
      instructions: uploadInstructions({ method: "POST" }),
      onProgress: vi.fn(),
    });

    const body = requests[0]?.body;
    expect(requests[0]).toMatchObject({
      bodyType: "FormData",
      method: "POST",
      url: "https://minio.example.test/presigned",
    });
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("policy")).toBe("signed-policy");
    expect((body as FormData).get("file")).toBeInstanceOf(File);
  });
});

function uploadFile(): File {
  return new File(["x".repeat(1024)], "notice.pdf", {
    type: "application/pdf",
  });
}

function uploadInstructions(input: {
  method: "POST" | "PUT";
}): DocumentUploadInstructions {
  return {
    completion_url: "/api/v1/documents/uploads/upload-1/complete/",
    expires_at: "2027-07-14T10:10:00Z",
    fields: input.method === "POST" ? { policy: "signed-policy" } : {},
    headers: { "Content-Type": "application/pdf" },
    method: input.method,
    polling_url: "/api/v1/documents/uploads/upload-1/",
    url: "https://minio.example.test/presigned",
  };
}

function uploadInitiation() {
  return {
    instructions: uploadInstructions({ method: "PUT" }),
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

function flatUploadInitiation() {
  return {
    completion_url: "/api/v1/documents/uploads/upload-1/complete/",
    expires_at: "2027-07-14T10:10:00Z",
    fields: {},
    headers: { "Content-Type": "application/pdf" },
    id: "upload-1",
    method: "PUT",
    polling_url: "/api/v1/documents/uploads/upload-1/",
    status: "initiated",
    url: "https://minio.example.test/presigned",
  };
}

function uploadSession() {
  return uploadInitiation().upload;
}

type XhrCall = {
  body: BodyInit | null;
  bodyType: string;
  headers: Record<string, string>;
  method: string;
  url: string;
};

function installFakeXhr(status: number): XhrCall[] {
  const requests: XhrCall[] = [];

  class FakeXhr {
    headers: Record<string, string> = {};
    method = "";
    status = status;
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
      onprogress: null,
    };
    url = "";
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;

    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }

    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }

    send(body: BodyInit) {
      requests.push({
        body,
        bodyType: body.constructor.name,
        headers: this.headers,
        method: this.method,
        url: this.url,
      });
      this.upload.onprogress?.(progressEvent(512, 1024));
      this.onload?.();
    }
  }

  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  return requests;
}

function progressEvent(loaded: number, total: number): ProgressEvent {
  return { lengthComputable: true, loaded, total } as ProgressEvent;
}
