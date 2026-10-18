import { InvalidPointError } from "../errors/invalid-point.error";
import { createPeriodDate, type PeriodDate } from "./period-date.vo";

export type Point = {
  periodDate: PeriodDate;
  value: number;
}

export function createPoint(periodDate: string, value: number): Point {
  if (!Number.isFinite(value)) {
    throw new InvalidPointError(value);
  }
  return { periodDate: createPeriodDate(periodDate), value };
}
