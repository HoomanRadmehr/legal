import type { DeadlinePriority, DeadlineStatus, DeadlineView } from "../types";

export function deadlineViewLabel(view: DeadlineView): string {
  const labels: Record<DeadlineView, string> = {
    assigned_to_me: "Assigned to me",
    overdue: "Overdue",
    today: "Today",
    upcoming: "Upcoming",
  };
  return labels[view];
}

export function deadlineStatusLabel(status: DeadlineStatus): string {
  const labels: Record<DeadlineStatus, string> = {
    cancelled: "Cancelled",
    completed: "Completed",
    open: "Open",
  };
  return labels[status] ?? "Unknown status";
}

export function deadlinePriorityLabel(priority: DeadlinePriority): string {
  const labels: Record<DeadlinePriority, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    normal: "Normal",
  };
  return labels[priority] ?? "Unknown priority";
}

export function statusTone(status: DeadlineStatus) {
  if (status === "open") {
    return "warning";
  }
  if (status === "completed") {
    return "success";
  }
  return "neutral";
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
