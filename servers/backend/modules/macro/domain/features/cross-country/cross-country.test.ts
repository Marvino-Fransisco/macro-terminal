import { expect, test } from "bun:test";
import { createPoint } from "../../value-objects/point.vo";
import { crossCountryFeatures } from "./cross-country";
import { isStale } from "../staleness";

test("cross-sectional features use latest common period and descending midranks", () => {
  const result = crossCountryFeatures({
    USA: [createPoint("2023-01-01", 2), createPoint("2024-01-01", 99)],
    DEU: [createPoint("2023-01-01", 1)],
    JPN: [createPoint("2023-01-01", 3)],
  })!;
  expect(result.periodDate).toBe("2023-01-01");
  expect(result.countries.map((c) => c.rank)).toEqual([2, 3, 1]);
  expect(result.countries.map((c) => c.zscore)).toEqual([0, -1, 1]);
  expect(result.countries.map((c) => c.differenceVsUs)).toEqual([0, -1, 1]);
  const tied = crossCountryFeatures({ DEU: [createPoint("2023-01-01", 1)], JPN: [createPoint("2023-01-01", 1)] })!;
  expect(tied.countries.map((c) => c.rank)).toEqual([1.5, 1.5]);
  expect(tied.countries[0]!.zscore).toBeNull();
  expect(tied.countries[0]!.differenceVsUs).toBeNull();
});

test("missing common periods do not silently align different years", () => {
  expect(crossCountryFeatures({ USA: [createPoint("2024-01-01", 1)], DEU: [createPoint("2023-01-01", 2)] })).toBeUndefined();
});

test("staleness is frequency-aware and missing data is stale", () => {
  const now = new Date("2025-01-01");
  expect(isStale("2024-01-01", "annual", now)).toBe(false);
  expect(isStale("2024-01-01", "monthly", now)).toBe(true);
  expect(isStale(null, "daily", now)).toBe(true);
});
