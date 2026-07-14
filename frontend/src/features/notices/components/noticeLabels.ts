import type {
  NoticePriority,
  NoticeResponseStatus,
  NoticeStatus,
} from "../types";

export function noticeStatusLabel(status: NoticeStatus): string {
  const labels: Record<NoticeStatus, string> = {
    archived: "Archived",
    closed: "Closed",
    received: "Received",
    responded: "Responded",
    response_due: "Response due",
    under_review: "Under review",
  };
  return labels[status] ?? "Unknown status";
}

export function noticeResponseStatusLabel(
  status: NoticeResponseStatus,
): string {
  const labels: Record<NoticeResponseStatus, string> = {
    cancelled: "Cancelled",
    pending: "Pending",
    responded: "Responded",
  };
  return labels[status] ?? "Unknown response status";
}

export function noticePriorityLabel(priority: NoticePriority): string {
  const labels: Record<NoticePriority, string> = {
    critical: "Critical",
    high: "High",
    low: "Low",
    normal: "Normal",
  };
  return labels[priority] ?? "Unknown priority";
}

export function statusTone(status: NoticeStatus) {
  if (status === "archived" || status === "closed") {
    return "neutral";
  }
  if (status === "responded") {
    return "success";
  }
  return "warning";
}

export function responseTone(status: NoticeResponseStatus) {
  if (status === "responded") {
    return "success";
  }
  if (status === "cancelled") {
    return "neutral";
  }
  return "warning";
}

export function timelineActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "matter.archived": "Notice archived",
    "notice.created": "Notice created",
    "notice.response_deadline_changed": "Response deadline changed",
    "notice.updated": "Notice updated",
  };
  return labels[action] ?? "Notice activity";
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
