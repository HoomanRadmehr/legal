export type TaskStatus = "cancelled" | "done" | "in_progress" | "todo";
export type OpenTaskStatus = "in_progress" | "todo";
export type TaskView = "assigned_to_me";

export type TaskListItem = {
  assignee_id: string;
  cancelled_at: string | null;
  cancelled_by_id: string | null;
  completed_at: string | null;
  completed_by_id: string | null;
  created_at: string;
  due_at: string | null;
  id: string;
  matter_id: string;
  status: TaskStatus;
  title: string;
  updated_at: string;
  version: number;
};

export type TaskDetail = TaskListItem & {
  description: string;
};

export type PaginatedResponse<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type TaskListParams = {
  assignee?: string;
  dueAfter?: string;
  dueBefore?: string;
  matter?: string;
  ordering?: TaskOrdering;
  page?: number;
  status?: TaskStatus | "";
  view?: TaskView;
};

export type TaskOrdering =
  | "-created_at"
  | "-due_at"
  | "-status"
  | "-updated_at"
  | "created_at"
  | "due_at"
  | "status"
  | "updated_at";

export type TaskInput = {
  assignee_id: string;
  description?: string;
  due_at?: string | null;
  matter_id: string;
  status: OpenTaskStatus;
  title: string;
};

export type TaskUpdateInput = Partial<TaskInput> & {
  version: number;
};

export type MembershipChoice = {
  display_name: string;
  id: string;
  role: string;
  status?: string;
  user_id?: string;
};
