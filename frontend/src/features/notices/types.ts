export type NoticeStatus =
  | "archived"
  | "closed"
  | "received"
  | "responded"
  | "response_due"
  | "under_review";
export type NoticePriority = "critical" | "high" | "low" | "normal";
export type NoticeResponseStatus = "cancelled" | "pending" | "responded";

export type NoticeListItem = {
  archived_at: string | null;
  created_at: string;
  id: string;
  linked_deadline_id: string;
  owner_id: string;
  priority: NoticePriority;
  received_date: string;
  reference_code: string;
  response_deadline: string;
  response_status: NoticeResponseStatus;
  sender: string;
  status: NoticeStatus;
  title: string;
  updated_at: string;
  version: number;
};

export type NoticeDetail = NoticeListItem & {
  closed_on: string | null;
  description: string;
  opened_on: string | null;
  related_matter_ids: string[];
};

export type NoticeTimelineEvent = {
  action: string;
  actor_membership_id: string | null;
  after_values: Record<string, unknown>;
  before_values: Record<string, unknown>;
  created_at: string;
  id: string;
  metadata: Record<string, unknown>;
  target_id: string | null;
  target_type: string;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type NoticeListParams = {
  archived?: boolean;
  ordering?: NoticeOrdering;
  overdue?: boolean;
  owner?: string;
  page?: number;
  receivedAfter?: string;
  receivedBefore?: string;
  responseDeadlineAfter?: string;
  responseDeadlineBefore?: string;
  responseStatus?: NoticeResponseStatus | "";
  search?: string;
  sender?: string;
  status?: NoticeStatus | "";
};

export type NoticeOrdering =
  | "-created_at"
  | "-priority"
  | "-received_date"
  | "-reference_code"
  | "-response_deadline"
  | "-sender"
  | "-updated_at"
  | "created_at"
  | "priority"
  | "received_date"
  | "reference_code"
  | "response_deadline"
  | "sender"
  | "updated_at";

export type NoticeInput = {
  closed_on?: string | null;
  description?: string;
  opened_on?: string | null;
  owner_id?: string;
  priority: NoticePriority;
  received_date: string;
  reference_code: string;
  related_matter_ids?: string[];
  response_deadline: string;
  response_status?: NoticeResponseStatus;
  sender: string;
  status?: NoticeStatus;
  title: string;
};

export type NoticeUpdateInput = Partial<NoticeInput> & {
  version: number;
};

export type RelatedMatterChoice = {
  id: string;
  kind: "case" | "contract";
  reference_code: string;
  title: string;
};

export type RelatedMatterLink = RelatedMatterChoice & {
  to: string;
};
