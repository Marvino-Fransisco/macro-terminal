import type { PeriodDate } from "../../../domain/value-objects/period-date.vo";

export type CalendarCriteria = {
  from: PeriodDate;
  to: PeriodDate;
  countryId?: string;
}
