import type {
  CasePriority,
  CaseStatus,
  CaseType,
  CasePartyRole,
} from "../types";

export function caseStatusLabel(status: CaseStatus): string {
  const labels: Record<CaseStatus, string> = {
    archived: "Archived",
    closed: "Closed",
    on_hold: "On hold",
    open: "Open",
    pending: "Pending",
  };
  return labels[status] ?? "Unknown status";
}

export function casePriorityLabel(priority: CasePriority): string {
  const labels: Record<CasePriority, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    normal: "Normal",
  };
  return labels[priority] ?? "Unknown priority";
}

export function caseTypeLabel(caseType: CaseType): string {
  const labels: Record<CaseType, string> = {
    internal: "Internal",
    litigation: "Litigation",
    other: "Other",
    regulatory: "Regulatory",
  };
  return labels[caseType] ?? "Other";
}

export function partyRoleLabel(role: CasePartyRole): string {
  const labels: Record<CasePartyRole, string> = {
    client: "Client",
    court: "Court or authority",
    opposing: "Opposing party",
    other: "Other",
    witness: "Witness",
  };
  return labels[role] ?? "Other";
}

export function timelineActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "case.created": "Case created",
    "case.updated": "Case updated",
    "matter.archived": "Case archived",
    "matter.owner_changed": "Owner changed",
  };
  return labels[action] ?? "Case activity";
}

export function statusTone(status: CaseStatus) {
  if (status === "archived" || status === "closed") {
    return "neutral";
  }
  if (status === "on_hold" || status === "pending") {
    return "warning";
  }
  return "success";
}
