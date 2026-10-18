import type { Point } from "../../value-objects/point.vo";
import type { CrossCountryResult } from "./type";
import { sampleDeviation, mean } from "../rolling";

export function crossCountryFeatures(histories: Record<string, Point[]>): CrossCountryResult | undefined {
  const entries = Object.entries(histories);
  if (entries.length < 2) return undefined;
  const indexed = entries.map(([country, points]) => ({ country, values: new Map(points.map((p) => [p.periodDate, p.value])) }));
  const dates = [...indexed[0]!.values.keys()].filter((date) => indexed.every((i) => i.values.has(date))).sort();
  const periodDate = dates.at(-1);
  if (!periodDate) return undefined;
  const values = indexed.map((i) => i.values.get(periodDate)!);
  if (values.some((value) => !Number.isFinite(value))) throw new Error("Cross-country inputs must be finite");
  const average = mean(values);
  const deviation = sampleDeviation(values);
  const us = indexed.find((i) => i.country === "USA")?.values.get(periodDate);
  return {
    periodDate,
    countries: indexed.map((item, index) => {
      const value = values[index]!;
      const above = values.filter((v) => v > value).length;
      const tied = values.filter((v) => v === value).length;
      return { country: item.country, value, rank: 1 + above + (tied - 1) / 2, zscore: deviation === 0 ? null : (value - average) / deviation, differenceVsUs: us === undefined ? null : value - us };
    }),
  };
}
