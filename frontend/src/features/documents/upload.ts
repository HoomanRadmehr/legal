import type { DirectUploadProgress, PresignedUpload } from "./types";

export type DirectUploadErrorCode =
  | "storage_forbidden"
  | "storage_network_error"
  | "storage_unavailable"
  | "storage_upload_failed"
  | "unsupported_upload_method"
  | "upload_cancelled";

export type DirectUploadFailure = Error & {
  code: DirectUploadErrorCode;
};

export function isDirectUploadError(
  error: unknown,
): error is DirectUploadFailure {
  return error instanceof Error && "code" in error;
}

function directUploadError(code: DirectUploadErrorCode): DirectUploadFailure {
  const error = new Error(code) as DirectUploadFailure;
  error.code = code;
  error.name = "DirectUploadError";
  return error;
}

type DirectUploadInput = {
  file: File;
  onProgress: (progress: DirectUploadProgress) => void;
  signal?: AbortSignal;
  upload: PresignedUpload;
};

const BLOCKED_STORAGE_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-csrf-token",
  "x-csrftoken",
]);

export function uploadFileDirectlyToMinio({
  file,
  onProgress,
  signal,
  upload,
}: DirectUploadInput): Promise<void> {
  if (upload.method !== "PUT") {
    return Promise.reject(directUploadError("unsupported_upload_method"));
  }
  return sendPutRequest({ file, onProgress, signal, upload });
}

export async function calculateOptionalSha256(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle || typeof file.arrayBuffer !== "function") {
    return "";
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return hexDigest(digest);
}

function sendPutRequest({
  file,
  onProgress,
  signal,
  upload,
}: DirectUploadInput): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const finish = requestFinisher({ file, onProgress, reject, resolve });
    const abort = () => {
      request.abort();
      finish.rejectWith(directUploadError("upload_cancelled"));
    };
    if (signal?.aborted) {
      finish.rejectWith(directUploadError("upload_cancelled"));
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    request.open("PUT", upload.url);
    request.withCredentials = false;
    setStorageHeaders(request, upload.headers);
    request.upload.onprogress = (event) =>
      handleUploadProgress(event, onProgress);
    request.onload = () => finish.resolveOrReject(request.status);
    request.onerror = () =>
      finish.rejectWith(directUploadError("storage_network_error"));
    request.onabort = () =>
      finish.rejectWith(directUploadError("upload_cancelled"));
    request.onloadend = () => signal?.removeEventListener("abort", abort);
    request.send(file);
  });
}

function requestFinisher({
  file,
  onProgress,
  reject,
  resolve,
}: {
  file: File;
  onProgress: (progress: DirectUploadProgress) => void;
  reject: (reason?: unknown) => void;
  resolve: () => void;
}) {
  let settled = false;
  return {
    rejectWith: (error: DirectUploadFailure) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    },
    resolveOrReject: (status: number) => {
      if (status >= 200 && status < 300 && !settled) {
        settled = true;
        onProgress(progressComplete(file));
        resolve();
        return;
      }
      if (!settled) {
        settled = true;
        reject(errorForStorageStatus(status));
      }
    },
  };
}

function setStorageHeaders(
  request: XMLHttpRequest,
  headers: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(headers)) {
    if (!BLOCKED_STORAGE_HEADERS.has(name.toLowerCase())) {
      request.setRequestHeader(name, value);
    }
  }
}

function handleUploadProgress(
  event: ProgressEvent,
  onProgress: (progress: DirectUploadProgress) => void,
): void {
  if (event.lengthComputable) {
    onProgress(progressFromEvent(event));
  }
}

function progressFromEvent(event: ProgressEvent): DirectUploadProgress {
  const percent = Math.round((event.loaded / event.total) * 100);
  return {
    loaded: event.loaded,
    percent: Math.min(percent, 99),
    total: event.total,
  };
}

function progressComplete(file: File): DirectUploadProgress {
  return {
    loaded: file.size,
    percent: 100,
    total: file.size,
  };
}

function errorForStorageStatus(status: number): DirectUploadFailure {
  if (status === 401 || status === 403) {
    return directUploadError("storage_forbidden");
  }
  if (status >= 500) {
    return directUploadError("storage_unavailable");
  }
  return directUploadError("storage_upload_failed");
}

function hexDigest(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
