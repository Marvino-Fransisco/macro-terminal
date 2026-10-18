import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { ReleaseEvent } from "../../../domain/entities/release-event.entity";
import type { Series } from "../../../domain/entities/series.entity";
import type { IndicatorCode } from "../../../domain/value-objects/indicator-code.vo";
import type { Point } from "../../../domain/value-objects/point.vo";
import type { AttributionResponse } from "./attribution.response";

export type OverviewIndicatorResponse = Pick<Series, "provider" | "frequency" | "unit" | "methodology"> & {
  indicator: IndicatorCode;
  latest: Point;
  previous: Point | null;
  change: number | null;
  nextRelease: ReleaseEvent | null;
}

export type OverviewResponse = {
  country: CountryIso3;
  indicators: OverviewIndicatorResponse[];
  attributions: AttributionResponse[];
}
