import { apiClient } from "../../api/client";
import type { DashboardSummary } from "./types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiClient.request<DashboardSummary>("/dashboard/");
}
