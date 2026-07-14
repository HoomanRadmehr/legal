import type { MembershipChoice, TaskStatus } from "../types";

export function taskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    cancelled: "Cancelled",
    done: "Done",
    in_progress: "In progress",
    todo: "To do",
  };
  return labels[status] ?? "Unknown status";
}

export function taskStatusTone(status: TaskStatus) {
  if (status === "done") {
    return "success";
  }
  if (status === "cancelled") {
    return "neutral";
  }
  return "warning";
}

export function membershipRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    legal_admin: "Legal admin",
    legal_counsel: "Legal counsel",
    legal_manager: "Legal manager",
    viewer: "Viewer",
  };
  return labels[role] ?? role;
}

export function membershipChoiceLabel(choice: MembershipChoice): string {
  return `${choice.display_name || choice.id} (${membershipRoleLabel(choice.role)})`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
