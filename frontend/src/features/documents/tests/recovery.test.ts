import { expect, test } from "vitest";

import { applyDocumentStatusEvent } from "../hooks";
import type { DocumentRecord } from "../types";

test("document status events cannot regress a final document state", () => {
  const document = documentRecord("available");
  const result = applyDocumentStatusEvent(document, {
    data: { document_id: "document-1", status: "verifying" },
    event_id: "event-1",
    event_type: "document.upload.status_changed",
    occurred_at: "2027-07-14T10:00:00Z",
    version: 1,
  });

  expect(result.status).toBe("available");
});

test("document status events for another document are ignored", () => {
  const document = documentRecord("verifying");
  const result = applyDocumentStatusEvent(document, {
    data: { document_id: "document-2", status: "available" },
    event_id: "event-2",
    event_type: "document.upload.status_changed",
    occurred_at: "2027-07-14T10:01:00Z",
    version: 1,
  });

  expect(result.status).toBe("verifying");
});

function documentRecord(status: DocumentRecord["status"]): DocumentRecord {
  return {
    actual_checksum: "",
    content_type: "application/pdf",
    created_at: "2027-07-14T10:00:00Z",
    description: "",
    etag: "",
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
