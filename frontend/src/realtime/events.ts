export const USER_EVENT_VERSION = 1;
export const DOCUMENT_UPLOAD_STATUS_CHANGED = "document.upload.status_changed";

export type UserEventEnvelope = {
  data: Record<string, unknown>;
  event_id: string;
  event_type: string;
  occurred_at: string;
  version: number;
};

export type DocumentUploadStatusEvent = UserEventEnvelope & {
  data: {
    document_id: string;
    progress?: number;
    status: string;
    upload_id?: string;
  };
  event_type: typeof DOCUMENT_UPLOAD_STATUS_CHANGED;
  version: typeof USER_EVENT_VERSION;
};

export function parseUserEvent(input: unknown): UserEventEnvelope | null {
  if (!isRecord(input)) {
    return null;
  }
  if (
    typeof input.event_id !== "string" ||
    typeof input.event_type !== "string" ||
    typeof input.occurred_at !== "string" ||
    typeof input.version !== "number" ||
    !isRecord(input.data)
  ) {
    return null;
  }
  return input as UserEventEnvelope;
}

export function isSupportedUserEvent(
  event: UserEventEnvelope | null,
): event is DocumentUploadStatusEvent {
  if (!event || event.version !== USER_EVENT_VERSION) {
    return false;
  }
  if (event.event_type !== DOCUMENT_UPLOAD_STATUS_CHANGED) {
    return false;
  }
  return hasUploadStatusData(event.data);
}

function hasUploadStatusData(
  data: Record<string, unknown>,
): data is DocumentUploadStatusEvent["data"] {
  return (
    typeof data.document_id === "string" && typeof data.status === "string"
  );
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
