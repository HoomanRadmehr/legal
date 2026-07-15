export type DocumentStatus =
  | "available"
  | "cancelled"
  | "expired"
  | "failed"
  | "pending_upload"
  | "verifying";

export type DirectUploadState =
  | "available"
  | "cancelled"
  | "completing"
  | "expired"
  | "failed"
  | "idle"
  | "preparing"
  | "requesting_presign"
  | "uploaded_to_storage"
  | "uploading"
  | "verifying";

export type CreateDocumentPresignInput = {
  checksum_sha256?: string;
  content_type: string;
  description?: string;
  filename: string;
  matter_id: string;
  size: number;
};

export type DocumentUploadIntent = {
  filename: string;
  id: string;
  status: DocumentStatus;
  upload_expires_at: string | null;
};

export type PresignedUpload = {
  expires_at: string;
  headers: Record<string, string>;
  method: "PUT";
  url: string;
};

export type CreateDocumentPresignResponse = {
  document: DocumentUploadIntent;
  upload: PresignedUpload;
};

export type DocumentUploadSummary = {
  content_type: string;
  filename: string;
  id: string;
  size: number | null;
  status: DocumentStatus;
  uploaded_at: string | null;
};

export type DocumentRecord = {
  actual_checksum: string;
  content_type: string;
  created_at: string;
  description: string;
  etag: string;
  expected_checksum: string;
  expected_size: number;
  failure_code: string;
  id: string;
  matter_id: string;
  original_filename: string;
  size: number | null;
  status: DocumentStatus;
  updated_at: string;
  upload_expires_at: string | null;
  uploaded_at: string | null;
  uploaded_by_id: string;
};

export type DocumentListParams = {
  matter?: string;
  ordering?: string;
  page?: number;
};

export type DocumentDownloadUrl = {
  expires_in_seconds: number;
  url: string;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type DirectUploadProgress = {
  loaded: number;
  percent: number;
  total: number;
};

export type MatterChoice = {
  id: string;
  kind: "case" | "contract" | "notice";
  label: string;
  secondary_label: string;
};

export type ChoicePage<TChoice> = {
  has_more: boolean;
  next_cursor: string | null;
  results: TChoice[];
};
