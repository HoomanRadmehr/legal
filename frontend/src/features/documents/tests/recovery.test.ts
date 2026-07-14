import { expect, test } from "vitest";

import { applyUploadStatusEvent } from "../hooks";
import type { DocumentUploadSession } from "../types";

test("upload status events cannot regress a final upload state", () => {
  const session = uploadSession("available");
  const result = applyUploadStatusEvent(session, {
    data: { status: "processing", upload_id: "upload-1" },
    event_id: "event-1",
    event_type: "document.upload.status_changed",
    occurred_at: "2027-07-14T10:00:00Z",
    version: 1,
  });

  expect(result.status).toBe("available");
});

function uploadSession(status: DocumentUploadSession["status"]) {
  return {
    completed_at: "2027-07-14T10:05:00Z",
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
    updated_at: "2027-07-14T10:05:00Z",
  };
}
