export type CaseStatus = "archived" | "closed" | "on_hold" | "open" | "pending";
export type CasePriority = "critical" | "high" | "low" | "normal";
export type CaseType = "internal" | "litigation" | "other" | "regulatory";
export type CasePartyRole =
  "client" | "court" | "opposing" | "other" | "witness";

export type CaseParty = {
  contact_summary: string;
  id?: string;
  name: string;
  role: CasePartyRole;
};

export type CaseListItem = {
  archived_at: string | null;
  case_type: CaseType;
  created_at: string;
  id: string;
  owner_id: string;
  priority: CasePriority;
  reference_code: string;
  status: CaseStatus;
  title: string;
  updated_at: string;
  version: number;
};

export type CaseDetail = CaseListItem & {
  closed_on: string | null;
  court_or_authority: string;
  description: string;
  filing_date: string | null;
  opened_on: string | null;
  outcome_summary: string;
  parties: CaseParty[];
};

export type CaseTimelineEvent = {
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

export type CaseListParams = {
  archived?: boolean;
  caseType?: CaseType | "";
  createdAfter?: string;
  createdBefore?: string;
  openedAfter?: string;
  openedBefore?: string;
  ordering?: CaseOrdering;
  owner?: string;
  page?: number;
  priority?: CasePriority | "";
  search?: string;
  status?: CaseStatus | "";
};

export type CaseOrdering =
  | "-created_at"
  | "-priority"
  | "-reference_code"
  | "-updated_at"
  | "case_type"
  | "created_at"
  | "priority"
  | "reference_code"
  | "updated_at";

export type CaseInput = {
  case_type: CaseType;
  closed_on?: string | null;
  court_or_authority?: string;
  description?: string;
  filing_date?: string | null;
  opened_on?: string | null;
  outcome_summary?: string;
  owner_id?: string;
  parties?: CasePartyInput[];
  priority: CasePriority;
  reference_code: string;
  status?: CaseStatus;
  title: string;
};

export type CaseUpdateInput = Partial<CaseInput> & {
  version: number;
};

export type CasePartyInput = {
  contact_summary?: string;
  name: string;
  role: CasePartyRole;
};
