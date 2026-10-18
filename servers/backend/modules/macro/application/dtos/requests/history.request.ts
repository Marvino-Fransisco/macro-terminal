import type { PeriodDate } from "../../../domain/value-objects/period-date.vo";

export type HistoryRequest = {
  countryId: string;
  indicatorId: string;
  from?: PeriodDate;
  to?: PeriodDate;
  asOf?: PeriodDate;
}
