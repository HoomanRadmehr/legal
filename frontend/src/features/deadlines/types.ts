export type DeadlineStatus = "cancelled" | "completed" | "open";
export type DeadlinePriority = "critical" | "high" | "low" | "normal";
export type DeadlineView = "assigned_to_me" | "overdue" | "today" | "upcoming";

export type DeadlineListItem = {
  assignee_id: string;
  cancelled_at: string | null;
  cancelled_by_id: string | null;
  completed_at: string | null;
  completed_by_id: string | null;
  created_at: string;
  due_at: string;
  id: string;
  matter_id: string;
  priority: DeadlinePriority;
  reminder_enabled: boolean;
  status: DeadlineStatus;
  title: string;
  updated_at: string;
  version: number;
};

export type DeadlineDetail = DeadlineListItem & {
  description: string;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type DeadlineListParams = {
  assignee?: string;
  dueAfter?: string;
  dueBefore?: string;
  matter?: string;
  ordering?: DeadlineOrdering;
  page?: number;
  priority?: DeadlinePriority | "";
  status?: DeadlineStatus | "";
  view: DeadlineView;
};

export type DeadlineOrdering =
  | "-created_at"
  | "-due_at"
  | "-priority"
  | "-status"
  | "-updated_at"
  | "created_at"
  | "due_at"
  | "priority"
  | "status"
  | "updated_at";

export type DeadlineInput = {
  assignee_id: string;
  description?: string;
  due_at: string;
  matter_id: string;
  priority: DeadlinePriority;
  reminder_enabled?: boolean;
  title: string;
};

export type DeadlineUpdateInput = Partial<DeadlineInput> & {
  version: number;
};
