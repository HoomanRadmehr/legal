export type ActivityItem = {
  action: string;
  actor_membership_id: string | null;
  actor_user_id?: string | null;
  after_values: Record<string, unknown>;
  before_values: Record<string, unknown>;
  created_at: string;
  id: string;
  matter_id?: string | null;
  metadata: Record<string, unknown>;
  request_id?: string | null;
  target_id: string | null;
  target_type: string;
  updated_at?: string;
};

export type ActivityListParams = {
  action?: string;
  actor?: string;
  createdAfter?: string;
  createdBefore?: string;
  matter?: string;
  page?: number;
  targetId?: string;
  targetType?: string;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type TimelineContext = "activity" | "case" | "contract" | "notice";
