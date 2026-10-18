import type { PeriodDate } from "../../../domain/value-objects/period-date.vo";

export type HistoryCriteria = {
  countryId: string;
  indicatorId: string;
  publicOnly: boolean;
  from?: PeriodDate;
  to?: PeriodDate;
  asOf?: PeriodDate;
}
