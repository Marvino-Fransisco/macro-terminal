import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { Series } from "../../../domain/entities/series.entity";
import type { CrossCountryResult } from "../../../domain/features/cross-country/type";
import type { IndicatorCode } from "../../../domain/value-objects/indicator-code.vo";
import type { PeriodDate } from "../../../domain/value-objects/period-date.vo";
import type { AttributionResponse } from "./attribution.response";

export type CompareSourceResponse = Pick<Series, "provider" | "methodology"> & {
  country: CountryIso3;
  seriesId: string;
}

export type CompareObservationResponse = {
  periodDate: PeriodDate;
  values: Record<string, number>;
}

export type CompareResponse = Pick<Series, "frequency" | "unit"> & {
  indicator: IndicatorCode;
  countries: CountryIso3[];
  crossSection: CrossCountryResult | null;
  mixedProviders: boolean;
  sources: CompareSourceResponse[];
  observations: CompareObservationResponse[];
  attributions: AttributionResponse[];
}
