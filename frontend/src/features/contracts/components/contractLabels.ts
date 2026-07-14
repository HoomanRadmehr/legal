import type {
  ContractDetail,
  ContractListItem,
  ContractPriority,
  ContractStatus,
  ContractType,
} from "../types";

export function contractStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    active: "Active",
    archived: "Archived",
    draft: "Draft",
    expired: "Expired",
    terminated: "Terminated",
  };
  return labels[status] ?? "Unknown status";
}

export function contractPriorityLabel(priority: ContractPriority): string {
  const labels: Record<ContractPriority, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    normal: "Normal",
  };
  return labels[priority] ?? "Unknown priority";
}

export function contractTypeLabel(contractType: ContractType): string {
  const labels: Record<ContractType, string> = {
    employment: "Employment",
    nda: "NDA",
    other: "Other",
    service: "Service",
    vendor: "Vendor",
  };
  return labels[contractType] ?? "Other";
}

export function statusTone(status: ContractStatus) {
  if (status === "archived" || status === "terminated") {
    return "neutral";
  }
  if (status === "draft") {
    return "warning";
  }
  if (status === "expired") {
    return "danger";
  }
  return "success";
}

export function timelineActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "contract.created": "Contract created",
    "contract.updated": "Contract updated",
    "matter.archived": "Contract archived",
    "matter.owner_changed": "Owner changed",
  };
  return labels[action] ?? "Contract activity";
}

export function lifecycleLabel(contract: ContractListItem | ContractDetail) {
  if (contract.status === "expired") {
    return "Expired contract";
  }
  if (contract.renewal_date && isWithinDays(contract.renewal_date, 30)) {
    return "Renewal date within 30 days";
  }
  if (contract.expiration_date && isWithinDays(contract.expiration_date, 30)) {
    return "Expiration date within 30 days";
  }
  return "No date warning";
}

function isWithinDays(dateValue: string, days: number): boolean {
  const today = startOfToday();
  const target = new Date(`${dateValue}T00:00:00`);
  const milliseconds = target.getTime() - today.getTime();
  return milliseconds >= 0 && milliseconds <= days * 24 * 60 * 60 * 1000;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
