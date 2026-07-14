import { expect, test } from "vitest";

import { createNetworkError } from "../api/errors";
import { createAppQueryClient } from "./queryClient";

test("configures bounded query retries and disables mutation retries", () => {
  const client = createAppQueryClient();
  const queryRetry = client.getDefaultOptions().queries?.retry;

  if (typeof queryRetry !== "function") {
    throw new Error("Query retry default must be a function.");
  }

  expect(queryRetry(0, createNetworkError())).toBe(true);
  expect(queryRetry(2, createNetworkError())).toBe(false);
  expect(client.getDefaultOptions().mutations?.retry).toBe(false);
});
