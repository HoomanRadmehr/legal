export type ContractStatus =
  "active" | "archived" | "draft" | "expired" | "terminated";
export type ContractPriority = "critical" | "high" | "low" | "normal";
export type ContractType =
  "employment" | "nda" | "other" | "service" | "vendor";

export type ContractListItem = {
  archived_at: string | null;
  contract_type: ContractType;
  counterparty: string;
  created_at: string;
  effective_date: string;
  expiration_date: string | null;
  id: string;
  owner_id: string;
  priority: ContractPriority;
  reference_code: string;
  renewal_date: string | null;
  status: ContractStatus;
  title: string;
  updated_at: string;
  version: number;
};

export type ContractDetail = ContractListItem & {
  closed_on: string | null;
  description: string;
  key_terms: Record<string, unknown>;
  opened_on: string | null;
};

export type ContractTimelineEvent = {
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

export type ContractListParams = {
  archived?: boolean;
  contractType?: ContractType | "";
  counterparty?: string;
  effectiveAfter?: string;
  effectiveBefore?: string;
  expirationAfter?: string;
  expirationBefore?: string;
  ordering?: ContractOrdering;
  owner?: string;
  page?: number;
  priority?: ContractPriority | "";
  renewalAfter?: string;
  renewalBefore?: string;
  search?: string;
  status?: ContractStatus | "";
};

export type ContractOrdering =
  | "-created_at"
  | "-effective_date"
  | "-expiration_date"
  | "-priority"
  | "-reference_code"
  | "-renewal_date"
  | "-updated_at"
  | "contract_type"
  | "counterparty"
  | "created_at"
  | "effective_date"
  | "expiration_date"
  | "priority"
  | "reference_code"
  | "renewal_date"
  | "updated_at";

export type ContractInput = {
  closed_on?: string | null;
  contract_type: ContractType;
  counterparty: string;
  description?: string;
  effective_date: string;
  expiration_date?: string | null;
  key_terms: Record<string, unknown>;
  opened_on?: string | null;
  owner_id?: string;
  priority: ContractPriority;
  reference_code: string;
  renewal_date?: string | null;
  status?: ContractStatus;
  title: string;
};

export type ContractUpdateInput = Partial<ContractInput> & {
  version: number;
};
