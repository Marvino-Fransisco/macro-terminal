import type { FeatureCode } from "../../../domain/value-objects/feature-code.vo";
import type { PeriodDate } from "../../../domain/value-objects/period-date.vo";

export type FeatureCriteria = {
  countryId: string;
  code: FeatureCode;
  from?: PeriodDate;
  to?: PeriodDate;
}
