import { afterEach, describe, expect, test, vi } from "vitest";

import {
  completeDocumentUpload,
  createDocumentPresign,
  requestDocumentDownloadUrl,
} from "../api";
import { uploadFileDirectlyToMinio } from "../upload";
import type { PresignedUpload } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("document direct upload API", () => {
  test("requests presign without file bytes or client-owned storage fields", async () => {
    const fetchImpl = vi.fn(async () => Response.json(presignResponse()));
    vi.stubGlobal("fetch", fetchImpl);

    const result = await createDocumentPresign(
      {
        checksum_sha256: "",
        content_type: "application/pdf",
        description: "Notice",
        filename: "notice.pdf",
        matter_id: "matter-1",
        size: 1024,
      },
      "idem-1",
    );

    const request = firstRequestInit(fetchImpl);
    expect(result.document.id).toBe("document-1");
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/documents/presign/"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(request.body).toBe(
      JSON.stringify({
        checksum_sha256: "",
        content_type: "application/pdf",
        description: "Notice",
        filename: "notice.pdf",
        matter_id: "matter-1",
        size: 1024,
      }),
    );
    expect((request.headers as Headers).get("Idempotency-Key")).toBe("idem-1");
    expect(String(request.body)).not.toContain("object_key");
    expect(String(request.body)).not.toContain("organization_id");
    expect(String(request.body)).not.toContain("File");
  });

  test("completes document upload without sending object metadata", async () => {
    const fetchImpl = vi.fn(async () => Response.json(documentSummary()));
    vi.stubGlobal("fetch", fetchImpl);

    await completeDocumentUpload("document-1");

    const request = firstRequestInit(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/documents/document-1/complete/"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(request.body).toBe(JSON.stringify({}));
    expect(String(request.body)).not.toContain("object_key");
    expect(String(request.body)).not.toContain("bucket");
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

  test("uploads PUT bytes to MinIO with returned safe headers only", async () => {
    const requests = installFakeXhr(204);
    const progress: number[] = [];

    await uploadFileDirectlyToMinio({
      file: uploadFile(),
      onProgress: (event) => progress.push(event.percent),
      upload: presignedPut({
        Authorization: "Bearer should-not-leak",
        Cookie: "refresh=secret",
        "Content-Type": "application/pdf",
      }),
    });

    expect(requests[0]).toMatchObject({
      bodyType: "File",
      headers: { "Content-Type": "application/pdf" },
      method: "PUT",
      url: "https://minio.example.test/presigned",
      withCredentials: false,
    });
    expect(requests[0]?.headers.Authorization).toBeUndefined();
    expect(requests[0]?.headers.Cookie).toBeUndefined();
    expect(progress).toEqual([50, 100]);
  });

  test("maps MinIO 403 to a safe upload error", async () => {
    installFakeXhr(403);

    await expect(
      uploadFileDirectlyToMinio({
        file: uploadFile(),
        onProgress: vi.fn(),
        upload: presignedPut(),
      }),
    ).rejects.toMatchObject({
      code: "storage_forbidden",
    });
  });
});

function presignResponse() {
  return {
    document: {
      filename: "notice.pdf",
      id: "document-1",
      status: "pending_upload",
      upload_expires_at: "2027-07-14T10:10:00Z",
    },
    upload: presignedPut(),
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

function uploadFile(): File {
  return new File(["x".repeat(1024)], "notice.pdf", {
    type: "application/pdf",
  });
}

function presignedPut(headers: Record<string, string> = {}): PresignedUpload {
  return {
    expires_at: "2027-07-14T10:10:00Z",
    headers,
    method: "PUT",
    url: "https://minio.example.test/presigned",
  };
}

type XhrCall = {
  body: BodyInit | null;
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
    method = "";
    onabort: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    onloadend: (() => void) | null = null;
    status = status;
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
      onprogress: null,
    };
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
        body,
        bodyType: body.constructor.name,
        headers: this.headers,
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

function progressEvent(loaded: number, total: number): ProgressEvent {
  return { lengthComputable: true, loaded, total } as ProgressEvent;
}

function firstRequestInit(fetchImpl: ReturnType<typeof vi.fn>): RequestInit {
  const calls = fetchImpl.mock.calls as unknown as [
    RequestInfo | URL,
    RequestInit,
  ][];
  expect(calls[0]).toBeDefined();
  return calls[0]?.[1] ?? {};
}
