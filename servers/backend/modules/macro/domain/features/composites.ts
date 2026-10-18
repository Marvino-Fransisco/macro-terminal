import type { Point } from "../value-objects/point.vo";
import { asOf, lagged, sortedPoints } from "./alignment";
import { mean, movingAverage } from "./rolling";

export function combine(inputs: readonly Point[][], compute: (values: number[]) => number | undefined): Point[] {
  if (inputs.length === 0 || inputs.some((input) => input.length === 0)) return [];
  const sorted = inputs.map(sortedPoints);
  const dates = [...new Set(sorted.flatMap((points) => points.map((p) => p.periodDate)))].sort();
  return dates.flatMap((periodDate) => {
    const points = sorted.map((input) => asOf(input, periodDate));
    if (points.some((p) => !p)) return [];
    const value = compute(points.map((p) => p!.value));
    return value !== undefined && Number.isFinite(value) ? [{ periodDate, value }] : [];
  });
}

export function spread(left: Point[], right: Point[]): Point[] {
  return combine([left, right], ([a, b]) => a! - b!);
}

export function sahm(input: Point[]): Point[] {
  const points = sortedPoints(input);
  const averages = points.flatMap((point) => {
    const one = lagged(points, point, "monthly", 1);
    const two = lagged(points, point, "monthly", 2);
    return one && two ? [{ periodDate: point.periodDate, value: mean([point.value, one.value, two.value]) }] : [];
  });
  return averages.flatMap((point) => {
    const previous = Array.from({ length: 12 }, (_, index) => lagged(averages, point, "monthly", index + 1));
    if (previous.some((p) => !p)) return [];
    return [{ periodDate: point.periodDate, value: point.value - Math.min(...previous.map((p) => p!.value)) }];
  });
}

export function payrollsChange(input: Point[]): Point[] {
  const points = sortedPoints(input);
  const changes = points.flatMap((point) => {
    const prior = lagged(points, point, "monthly", 1);
    return prior ? [{ periodDate: point.periodDate, value: point.value - prior.value }] : [];
  });
  return movingAverage(changes, 3).filter((point) => lagged(changes, point, "monthly", 1) && lagged(changes, point, "monthly", 2));
}

export function taylorRate(inflation: number, outputGap: number): number {
  return 2 + inflation + 0.5 * (inflation - 2) + 0.5 * outputGap;
}

export function regime(growthImpulse: number, inflationImpulse: number): number {
  if (growthImpulse >= 0) return inflationImpulse >= 0 ? 1 : 2;
  return inflationImpulse >= 0 ? 3 : 4;
}

export function usdBillions(points: Point[], unit: string): Point[] {
  const normalized = unit.trim().toLowerCase().replaceAll("u.s.", "us");
  const scales: Record<string, number> = { "billions of us dollars": 1, "usd billions": 1, "millions of us dollars": 0.001, "us dollars": 1e-9, usd: 1e-9 };
  const scale = scales[normalized];
  if (scale === undefined) throw new Error(`Unsupported liquidity unit: ${unit}`);
  return points.map((point) => ({ ...point, value: point.value * scale }));
}
