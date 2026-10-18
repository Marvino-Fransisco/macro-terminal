import type {} from "@/types/bun";
import { expect, test } from "bun:test";
import { createPeriodDate } from "../value-objects/period-date.vo";
import { createPoint, type Point } from "../value-objects/point.vo";
import { asOf } from "./alignment";
import { difference, growth, revisions, yoy } from "./growth";
import { movingAverage, percentile, zscore } from "./rolling";
import { combine, payrollsChange, regime, sahm, taylorRate, usdBillions } from "./composites";
import { transform } from "./transforms";

function monthly(values: number[]): Point[] {
  return values.map((value, index) => createPoint(new Date(Date.UTC(2020, index, 1)).toISOString().slice(0, 10), value));
}

test("calendar lags do not bridge missing months", () => {
  const input = [createPoint("2024-01-01", 100), createPoint("2024-03-01", 110)];
  expect(growth(input, "monthly", 1)).toEqual([]);
  expect(difference(input, "monthly", 2)).toEqual([createPoint("2024-03-01", 10)]);
});

test("growth, yoy and annualization guard denominators and domains", () => {
  expect(growth(monthly([100, 110]), "monthly", 1)[0]!.value).toBeCloseTo(10);
  expect(growth(monthly([100, 101]), "monthly", 1, true)[0]!.value).toBeCloseTo((1.01 ** 12 - 1) * 100);
  expect(yoy(monthly([...Array<number>(12).fill(100), 105]), "monthly")[0]!.value).toBeCloseTo(5);
  expect(growth(monthly([0, 5]), "monthly", 1)).toEqual([]);
  expect(growth(monthly([-10, 5]), "monthly", 1, true)).toEqual([]);
});

test("daily yoy uses 365-day as-of lookup, never trading-session offsets", () => {
  expect(yoy([createPoint("2023-01-06", 100), createPoint("2024-01-08", 110)], "daily")[0]!.value).toBeCloseTo(10);
  expect(asOf(monthly([1, 2, 3]), "2020-02-15")!.value).toBe(2);
});

test("rolling sample z-score, tied expanding percentile and warmup", () => {
  expect(movingAverage(monthly([1, 2, 3]), 3)[0]!.value).toBe(2);
  expect(zscore(monthly([1, 2, 3]), 3)[0]!.value).toBe(1);
  expect(zscore(monthly([2, 2, 2]), 3)).toEqual([]);
  expect(percentile(monthly([1, 1, 1])).map((p) => p.value)).toEqual([50, 50, 50]);
  expect(() => movingAverage([], 0)).toThrow();
});

test("revision uses first and latest seen vintages", () => {
  const point = { seriesId: "x", periodDate: createPeriodDate("2024-01-01") };
  expect(revisions([{ ...point, value: 103, realtimeStart: createPeriodDate("2024-03-01") }, { ...point, value: 100, realtimeStart: createPeriodDate("2024-02-01") }])[0]!.value).toBe(3);
});

test("composites align without looking ahead and normalize liquidity", () => {
  expect(combine([monthly([10, 20]), [createPoint("2020-02-01", 1)]], ([a, b]) => a! - b!)).toEqual([createPoint("2020-02-01", 19)]);
  expect(usdBillions(monthly([1000]), "Millions of U.S. Dollars")[0]!.value).toBe(1);
  expect(usdBillions(monthly([1000]), "Billions of US Dollars")[0]!.value).toBe(1000);
  expect(() => usdBillions([], "euros")).toThrow();
  expect(taylorRate(3, -2)).toBe(4.5);
  expect([regime(1, 1), regime(1, -1), regime(-1, 1), regime(-1, -1)]).toEqual([1, 2, 3, 4]);
});

test("Sahm needs 12 prior contiguous monthly averages", () => {
  const values = [...Array<number>(14).fill(4), 5, 5];
  const result = sahm(monthly(values));
  expect(result[0]!.periodDate).toBe(createPeriodDate("2021-03-01"));
  expect(result.at(-1)!.value).toBeCloseTo(2 / 3);
  expect(sahm(monthly(values).filter((p) => p.periodDate !== "2020-05-01"))).toEqual([]);
  expect(payrollsChange(monthly([100, 110, 125, 145]))[0]!.value).toBe(15);
});

test("transform rejects incompatible frequencies and invalid feature names", () => {
  expect(() => transform([], "daily", "qoq_ann")).toThrow();
  expect(() => transform([], "monthly", "ma_0")).toThrow();
  expect(() => transform([], "monthly", "bogus")).toThrow();
  expect(() => transform([], "monthly", "zscore_1")).toThrow("at least 2");
});
