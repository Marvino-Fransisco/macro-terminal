import { expect, test } from "bun:test";
import type { Frequency } from "../../domain/value-objects/frequency.vo";
import { createIndicatorCode } from "../../domain/value-objects/indicator-code.vo";
import { createPeriodDate } from "../../domain/value-objects/period-date.vo";
import { createPriority } from "../../domain/value-objects/priority.vo";
import { createName } from "@/modules/shared/domain/value-objects/name.vo";
import type { SeriesHistoryModel } from "../../ports/dtos/models/series-history.model";
import { computeCountryFeatures } from "./compute-features";

const COUNTRY_ID = crypto.randomUUID();

function history(code: string, values: number[], frequency: Frequency = "monthly", unit = "Index"): SeriesHistoryModel {
  const id = crypto.randomUUID();
  const indicatorId = crypto.randomUUID();
  const timestamps = { createdAt: new Date("2022-01-01"), updatedAt: new Date("2022-01-01"), deletedAt: null };
  return {
    indicator: { id: indicatorId, ...timestamps, code: createIndicatorCode(code), name: createName(code), category: "growth", unit, frequency, seasonalAdjustment: "sa", description: "Test" },
    series: { id, createdAt: new Date("2022-01-01"), updatedAt: new Date("2022-01-01"), deletedAt: null, indicatorId, countryId: COUNTRY_ID, provider: "fred", providerSeriesId: code, priority: createPriority(1), frequency, unit, seasonalAdjustment: "sa", redistributable: false, isActive: true, lastPolledAt: null, nextPollAt: new Date(), providerLastUpdatedAt: null, providerReleaseId: null, methodology: "Test" },
    observations: values.map((value, index) => ({ id: crypto.randomUUID(), createdAt: new Date("2022-01-01"), updatedAt: new Date("2022-01-01"), deletedAt: null, seriesId: id, realtimeStart: createPeriodDate("2022-01-01"), periodDate: createPeriodDate(new Date(Date.UTC(2020, index, 1)).toISOString().slice(0, 10)), value })),
  };
}

test("country real policy rate falls back to monthly CPI and preserves provenance", () => {
  const policy = history("POLICY_RATE", Array<number>(13).fill(6), "monthly", "Percent");
  const cpi = history("CPI_HEADLINE", [...Array<number>(12).fill(100), 110]);
  const cpiOnly = computeCountryFeatures(COUNTRY_ID, [policy, cpi], new Date()).filter((p) => p.featureCode === "REAL_POLICY_RATE");
  expect(cpiOnly.length).toBe(1);
  expect(cpiOnly[0]!.value).toBeCloseTo(-4);
  expect(cpiOnly[0]!.sourceSeriesIds).toContain(cpi.series.id);
  const pce = history("PCE_PRICE_CORE", [...Array<number>(12).fill(100), 105]);
  const preferred = computeCountryFeatures(COUNTRY_ID, [policy, cpi, pce], new Date()).filter((p) => p.featureCode === "REAL_POLICY_RATE");
  expect(preferred.length).toBe(1);
  expect(preferred[0]!.value).toBeCloseTo(1);
  expect(preferred[0]!.sourceSeriesIds).toContain(pce.series.id);
  expect(preferred[0]!.sourceSeriesIds).not.toContain(cpi.series.id);
});

test("monthly composites reject annual fallback series and real GDP base-year mismatches", () => {
  const annualLabor = history("UNEMPLOYMENT_RATE", Array<number>(20).fill(4), "annual", "Percent");
  expect(computeCountryFeatures(COUNTRY_ID, [annualLabor], new Date()).some((p) => p.featureCode === "SAHM_RULE")).toBe(false);
  const actual = history("GDP_REAL", [100], "quarterly", "Billions of Chained 2017 Dollars");
  const potential = history("GDP_POTENTIAL", [100], "quarterly", "Billions of Chained 2012 Dollars");
  expect(() => computeCountryFeatures(COUNTRY_ID, [actual, potential], new Date())).toThrow("matching real GDP");
});
