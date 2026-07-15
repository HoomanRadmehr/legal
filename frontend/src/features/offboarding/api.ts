import { apiClient } from "../../api/client";
import type {
  OffboardingExecuteInput,
  OffboardingPreview,
  OffboardingPreviewInput,
  OffboardingRun,
} from "./types";

export async function previewOffboarding(
  input: OffboardingPreviewInput,
): Promise<OffboardingPreview> {
  return apiClient.request<OffboardingPreview>("/offboarding/preview/", {
    body: input,
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function executeOffboarding({
  idempotencyKey,
  input,
}: {
  idempotencyKey: string;
  input: OffboardingExecuteInput;
}): Promise<OffboardingRun> {
  return apiClient.request<OffboardingRun>("/offboarding/execute/", {
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function retrieveOffboardingRun(
  runId: string,
): Promise<OffboardingRun> {
  return apiClient.request<OffboardingRun>(`/offboarding/${runId}/`);
}
