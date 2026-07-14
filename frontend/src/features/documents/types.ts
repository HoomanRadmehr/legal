export type UploadStatus =
  | "available"
  | "cancelled"
  | "expired"
  | "failed"
  | "initiated"
  | "processing"
  | "verifying";

export type DocumentUploadInitiateInput = {
  checksum?: string;
  content_type: string;
  description?: string;
  filename: string;
  matter_id: string;
  size: number;
};

export type DocumentUploadSession = {
  completed_at: string | null;
  created_at: string;
  description: string;
  expected_checksum: string;
  expected_content_type: string;
  expected_size: number;
  expires_at: string;
  failure_code: string;
  id: string;
  matter_id: string;
  original_filename: string;
  requested_by_id: string;
  status: UploadStatus;
  updated_at: string;
};

export type DocumentUploadInstructions = {
  completion_url: string;
  expires_at: string;
  fields: Record<string, string>;
  headers: Record<string, string>;
  method: "POST" | "PUT";
  polling_url: string;
  url: string;
};

export type DocumentUploadInitiation = {
  instructions: DocumentUploadInstructions;
  upload: DocumentUploadSession;
};

export type UploadInitiationApiResponse =
  | DocumentUploadInitiation
  | {
      completion_url: string;
      expires_at: string;
      fields: Record<string, string>;
      headers: Record<string, string>;
      id: string;
      method: "POST" | "PUT";
      polling_url: string;
      status: UploadStatus;
      url: string;
    };

export type DocumentStatus = "available" | "processing" | "revoked";

export type DocumentRecord = {
  available_at: string | null;
  checksum: string;
  content_type: string;
  created_at: string;
  description: string;
  id: string;
  matter_id: string;
  original_filename: string;
  revoked_at: string | null;
  size: number;
  status: DocumentStatus;
  updated_at: string;
  upload_session_id: string;
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

export type DirectUploadInput = {
  file: File;
  instructions: DocumentUploadInstructions;
  onProgress: (progress: DirectUploadProgress) => void;
};
