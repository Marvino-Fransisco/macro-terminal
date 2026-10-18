import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { Series } from "../../../domain/entities/series.entity";
import type { IndicatorCode } from "../../../domain/value-objects/indicator-code.vo";
import type { Point } from "../../../domain/value-objects/point.vo";
import type { AttributionResponse } from "./attribution.response";

export type GetSeriesSummaryResponse = Pick<Series, "id" | "provider" | "providerSeriesId" | "frequency" | "unit" | "seasonalAdjustment" | "methodology">;

export type GetSeriesSourceResponse = Pick<Series, "providerSeriesId" | "provider" | "unit" | "methodology"> & {
  seriesId: string;
}

export type GetSeriesResponse = {
  country: CountryIso3;
  indicator: IndicatorCode;
  feature: string | null;
  series: GetSeriesSummaryResponse | null;
  sources?: GetSeriesSourceResponse[];
  observations: Point[];
  attributions: AttributionResponse[];
}
