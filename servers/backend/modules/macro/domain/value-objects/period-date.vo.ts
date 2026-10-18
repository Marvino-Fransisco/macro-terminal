import { InvalidPeriodDateError } from "../errors/invalid-period-date.error";

export type PeriodDate = string & { readonly __brand: "PeriodDate" };

export function createPeriodDate(value: string): PeriodDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InvalidPeriodDateError(value);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new InvalidPeriodDateError(value);
  }
  return value as PeriodDate;
}
