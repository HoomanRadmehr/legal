import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminUserQueryKeys } from "../adminUsers/hooks";
import {
  executeOffboarding,
  previewOffboarding,
  retrieveOffboardingRun,
} from "./api";
import type { OffboardingExecuteInput, OffboardingPreviewInput } from "./types";

export const offboardingQueryKeys = {
  all: ["api", "offboarding"] as const,
  run: (runId: string) => [...offboardingQueryKeys.all, "run", runId] as const,
};

export function useOffboardingPreview() {
  return useMutation({
    mutationFn: (input: OffboardingPreviewInput) => previewOffboarding(input),
  });
}

export function useOffboardingExecute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      idempotencyKey: string;
      payload: OffboardingExecuteInput;
    }) =>
      executeOffboarding({
        idempotencyKey: input.idempotencyKey,
        input: input.payload,
      }),
    onSuccess: (run) => {
      queryClient.setQueryData(offboardingQueryKeys.run(run.id), run);
      void queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
}

export function useOffboardingRun(runId: string | undefined) {
  return useQuery({
    enabled: Boolean(runId),
    queryFn: () => retrieveOffboardingRun(String(runId)),
    queryKey: offboardingQueryKeys.run(String(runId)),
  });
}

export function createOffboardingIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? fallbackIdempotencyKey();
}

function fallbackIdempotencyKey(): string {
  const value = Math.random().toString(16).slice(2).padEnd(32, "0");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-8${value.slice(17, 20)}-${value.slice(20, 32)}`;
}
