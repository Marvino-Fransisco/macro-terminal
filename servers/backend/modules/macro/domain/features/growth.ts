import type { Frequency } from "../value-objects/frequency.vo";
import type { ObservationInput } from "../entities/observation.entity";
import type { Point } from "../value-objects/point.vo";
import type { PeriodDate } from "../value-objects/period-date.vo";
import { asOf, lagged, sortedPoints } from "./alignment";

export function growth(input: readonly Point[], frequency: Frequency, lag: number, annualize = false): Point[] {
  if (!Number.isInteger(lag) || lag < 1) throw new Error("Lag must be a positive integer");
  const p = frequency === "monthly" ? 12 : frequency === "quarterly" ? 4 : frequency === "annual" ? 1 : undefined;
  if (annualize && !p) throw new Error("Annualization requires monthly, quarterly or annual frequency");
  const points = sortedPoints(input);
  return points.flatMap((point) => {
    const previous = lagged(points, point, frequency, lag);
    if (!previous || previous.value === 0) return [];
    const ratio = point.value / previous.value;
    if (annualize && ratio <= 0) return [];
    const value = (annualize ? ratio ** (p! / lag) - 1 : ratio - 1) * 100;
    return Number.isFinite(value) ? [{ periodDate: point.periodDate, value }] : [];
  });
}

export function yoy(input: readonly Point[], frequency: Frequency): Point[] {
  if (frequency === "monthly") return growth(input, frequency, 12);
  if (frequency === "quarterly") return growth(input, frequency, 4);
  if (frequency === "annual") return growth(input, frequency, 1);
  const points = sortedPoints(input);
  return points.flatMap((point) => {
    const date = new Date(Date.parse(point.periodDate) - 365 * 86400_000).toISOString().slice(0, 10);
    const previous = asOf(points, date);
    if (!previous || previous.value === 0) return [];
    const value = (point.value / previous.value - 1) * 100;
    return Number.isFinite(value) ? [{ periodDate: point.periodDate, value }] : [];
  });
}

export function difference(input: readonly Point[], frequency: Frequency, lag = 1): Point[] {
  if (!Number.isInteger(lag) || lag < 1) throw new Error("Lag must be a positive integer");
  const points = sortedPoints(input);
  return points.flatMap((point) => {
    const previous = lagged(points, point, frequency, lag);
    return previous ? [{ periodDate: point.periodDate, value: point.value - previous.value }] : [];
  });
}

export function revisions(observations: readonly ObservationInput[]): Point[] {
  const groups = new Map<PeriodDate, ObservationInput[]>();
  for (const row of observations) groups.set(row.periodDate, [...(groups.get(row.periodDate) ?? []), row]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([periodDate, rows]) => {
    rows.sort((a, b) => a.realtimeStart.localeCompare(b.realtimeStart));
    return { periodDate, value: rows.at(-1)!.value - rows[0]!.value };
  });
}
