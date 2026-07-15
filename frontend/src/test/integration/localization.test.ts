import { expect, test } from "vitest";

import {
  getAcceptLanguageHeader,
  getTextDirection,
} from "../../i18n/config";
import {
  inputToIsoDate,
  inputToLocalDateTime,
  isoDateToInput,
  localDateTimeToInput,
} from "../../i18n/date";

test("Persian critical date inputs round-trip to canonical ISO values", () => {
  expect(getTextDirection("fa")).toBe("rtl");
  expect(getAcceptLanguageHeader("fa")).toContain("fa-IR");
  expect(inputToIsoDate("1406-01-01", "fa")).toBe("2027-03-21");
  expect(isoDateToInput("2027-03-21", "fa")).toBe("1406-01-01");
  expect(inputToLocalDateTime("1406-04-24 12:00", "fa")).toBe(
    "2027-07-15T12:00",
  );
  expect(localDateTimeToInput("2027-07-15T12:00", "fa")).toBe(
    "1406-04-24 12:00",
  );
});
