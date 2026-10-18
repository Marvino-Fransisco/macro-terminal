import type { Frequency } from "../value-objects/frequency.vo";
import type { Point } from "../value-objects/point.vo";

export function sortedPoints(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.periodDate.localeCompare(b.periodDate));
  for (let i = 0; i < sorted.length; i++) {
    if (!Number.isFinite(sorted[i]!.value)) throw new Error("Feature input must be finite");
    if (i > 0 && sorted[i - 1]!.periodDate === sorted[i]!.periodDate) throw new Error("Feature input must have unique periods");
  }
  return sorted;
}

export function asOf(points: readonly Point[], date: string): Point | undefined {
  let low = 0;
  let high = points.length - 1;
  let result: Point | undefined;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const point = points[mid]!;
    if (point.periodDate <= date) { result = point; low = mid + 1; } else { high = mid - 1; }
  }
  return result;
}

export function periodKey(date: string, frequency: Frequency): string {
  if (frequency === "annual") return date.slice(0, 4);
  if (frequency === "quarterly") return `${date.slice(0, 4)}-Q${Math.ceil(Number(date.slice(5, 7)) / 3)}`;
  if (frequency === "monthly") return date.slice(0, 7);
  return date;
}

export function lagDate(date: string, frequency: Frequency, periods: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  if (frequency === "monthly" || frequency === "quarterly" || frequency === "annual") {
    const months = periods * (frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12);
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() - months);
  } else {
    result.setUTCDate(result.getUTCDate() - periods * (frequency === "weekly" ? 7 : 1));
  }
  return result.toISOString().slice(0, 10);
}

export function lagged(points: readonly Point[], point: Point, frequency: Frequency, periods: number): Point | undefined {
  const date = lagDate(point.periodDate, frequency, periods);
  if (frequency === "daily" || frequency === "weekly" || frequency === "irregular") return asOf(points, date);
  const candidate = asOf(points, `${date.slice(0, 7)}-31`);
  return candidate && periodKey(candidate.periodDate, frequency) === periodKey(date, frequency) ? candidate : undefined;
}
