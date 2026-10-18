import type { MacroRepository } from "../../ports/macro-repository.port";
import { createPeriodDate } from "../../domain/value-objects/period-date.vo";
import type { BackfillSeriesUseCase } from "../../ports/backfill-series.port";
import type { IngestSeriesUseCase } from "../../ports/ingest-series.port";

export function createBackfillSeries(repository: MacroRepository, ingest: IngestSeriesUseCase): BackfillSeriesUseCase {
  return async (seriesId, from, to) => {
    createPeriodDate(from);
    createPeriodDate(to);
    if (from > to) throw new Error("Backfill start must not exceed end");
    const series = await repository.findSeries(seriesId);
    if (!series) throw new Error("Series not found");
    return ingest(series, { from, to });
  };
}
