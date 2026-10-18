import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { Series } from "../../../domain/entities/series.entity";
import type { IndicatorCode } from "../../../domain/value-objects/indicator-code.vo";

export type CoverageRowResponse = {
  countryIso3: CountryIso3;
  indicatorCode: IndicatorCode;
  provider: Series["provider"];
  frequency: Series["frequency"];
  latestPeriod: string | null;
  periods: number;
}
