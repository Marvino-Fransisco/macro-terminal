import type { Indicator } from "../../../domain/entities/indicator.entity";
import type { Observation } from "../../../domain/entities/observation.entity";
import type { Series } from "../../../domain/entities/series.entity";

export type SeriesHistoryResponse = {
  series: Series;
  indicator: Indicator;
  observations: Observation[];
}
