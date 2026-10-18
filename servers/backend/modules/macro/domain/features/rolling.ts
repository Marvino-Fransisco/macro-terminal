import type { Point } from "../value-objects/point.vo";
import { sortedPoints } from "./alignment";

export function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("Mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sampleDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function rolling(input: readonly Point[], window: number, compute: (values: number[]) => number | undefined): Point[] {
  if (!Number.isInteger(window) || window < 1 || window > 10000) throw new Error("Window must be between 1 and 10000");
  const points = sortedPoints(input);
  return points.flatMap((point, index) => {
    if (index + 1 < window) return [];
    const value = compute(points.slice(index + 1 - window, index + 1).map((p) => p.value));
    return value !== undefined && Number.isFinite(value) ? [{ periodDate: point.periodDate, value }] : [];
  });
}

export function movingAverage(input: readonly Point[], window: number): Point[] {
  return rolling(input, window, mean);
}

export function zscore(input: readonly Point[], window: number): Point[] {
  if (window < 2) throw new Error("Z-score requires at least two observations");
  return rolling(input, window, (values) => {
    const deviation = sampleDeviation(values);
    return deviation === 0 ? undefined : (values.at(-1)! - mean(values)) / deviation;
  });
}

function insertionIndex(values: number[], value: number, afterEqual: boolean): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle]! < value || (afterEqual && values[middle] === value)) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function percentile(input: readonly Point[]): Point[] {
  const points = sortedPoints(input);
  const history: number[] = [];
  return points.map((point, index) => {
    const less = insertionIndex(history, point.value, false);
    const upper = insertionIndex(history, point.value, true);
    history.splice(upper, 0, point.value);
    return { periodDate: point.periodDate, value: index === 0 ? 50 : 100 * (less + (upper - less) / 2) / index };
  });
}
