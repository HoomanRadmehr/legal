import { afterEach, describe, expect, test } from "vitest";

import { buildCsrfHeaders, CSRF_HEADER_NAME, readCookieValue } from "./csrf";

afterEach(() => {
  document.cookie = "csrftoken=; Max-Age=0; path=/";
});

describe("CSRF helpers", () => {
  test("reads the CSRF cookie and builds the documented header", () => {
    document.cookie = "csrftoken=csrf-value; path=/";

    expect(readCookieValue("csrftoken")).toBe("csrf-value");
    expect(new Headers(buildCsrfHeaders()).get(CSRF_HEADER_NAME)).toBe(
      "csrf-value",
    );
  });

  test("omits the CSRF header when the cookie is absent", () => {
    expect(buildCsrfHeaders()).toEqual({});
  });
});
