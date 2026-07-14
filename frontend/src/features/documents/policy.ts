export const MAX_UPLOAD_SIZE_BYTES = 26_214_400;

const ALLOWED_CONTENT_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

export function allowedUploadTypes(): string {
  return Array.from(ALLOWED_CONTENT_TYPES).join(",");
}

export function filePolicyError(file: File): string {
  if (file.size <= 0) {
    return "Select a non-empty file.";
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "The selected file is larger than the upload limit.";
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return "This file type is not allowed.";
  }
  return "";
}
