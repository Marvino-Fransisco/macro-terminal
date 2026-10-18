import type { MacroRepository } from "../ports/macro-repository.port";
import { createPeriodDate } from "../../domain/value-objects/period-date.vo";
import type { createIngestSeries } from "./ingest-series";

export function createBackfillSeries(repository: MacroRepository, ingest: ReturnType<typeof createIngestSeries>) {
  return async (seriesId: string, from: string, to: string) => {
    createPeriodDate(from);
    createPeriodDate(to);
    if (from > to) throw new Error("Backfill start must not exceed end");
    const series = await repository.findSeries(seriesId);
    if (!series) throw new Error("Series not found");
    return ingest(series, { from, to });
  };
}
