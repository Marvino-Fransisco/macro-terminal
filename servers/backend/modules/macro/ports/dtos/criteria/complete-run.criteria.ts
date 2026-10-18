import type { Series } from "../../../domain/entities/series.entity";
import type { Point } from "../../../domain/value-objects/point.vo";

export type CompleteRunCriteria = {
  runId: string;
  series: Series;
  points: Point[];
  now: Date;
  nextPollAt: Date;
}
