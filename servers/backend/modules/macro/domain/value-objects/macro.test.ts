import { describe, expect, test } from "bun:test";
import { createCountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import { createName } from "@/modules/shared/domain/value-objects/name.vo";
import { createFrequency } from "./frequency.vo";
import { createIndicatorCode } from "./indicator-code.vo";
import { createPeriodDate } from "./period-date.vo";
import { createPoint } from "./point.vo";
import { createProvider } from "./provider.vo";

describe("macro value objects", () => {
  test("normalizes country and indicator codes", () => {
    expect(String(createCountryIso3(" usa "))).toBe("USA");
    expect(String(createIndicatorCode(" cpi_headline "))).toBe("CPI_HEADLINE");
    expect(() => createCountryIso3("US1")).toThrow();
    expect(() => createCountryIso3("US")).toThrow();
    expect(() => createIndicatorCode("bad-code")).toThrow();
  });
  test("rejects invalid dates and enums", () => {
    expect(String(createPeriodDate("2024-02-29"))).toBe("2024-02-29");
    expect(() => createPeriodDate("2023-02-29")).toThrow();
    expect(() => createFrequency("hourly")).toThrow();
    expect(() => createProvider("unknown")).toThrow();
  });
  test("creates points with valid dates and finite values", () => {
    expect(createPoint("2024-01-01", 1.5)).toEqual({ periodDate: createPeriodDate("2024-01-01"), value: 1.5 });
    expect(() => createPoint("2024-01-01", Number.NaN)).toThrow();
    expect(() => createPoint("bad", 1)).toThrow();
  });
  test("limits names to 100 characters", () => {
    expect(String(createName("  United States "))).toBe("United States");
    expect(String(createName("a".repeat(100))).length).toBe(100);
    expect(() => createName("a".repeat(101))).toThrow();
    expect(() => createName("   ")).toThrow();
  });
});
