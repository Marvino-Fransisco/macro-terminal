import type { MacroRepository } from "@/modules/macro/ports/macro-repository.port";
import type { IngestSeriesUseCase } from "@/modules/macro";

export function createIngestWorker(repository: MacroRepository, ingest: IngestSeriesUseCase) {
  return async () => {
    const due = await repository.claimDue({ now: new Date(), limit: 10 });
    for (const series of due) {
      try {
        const result = await ingest(series);
        console.info("macro ingestion succeeded", { seriesId: series.id, provider: series.provider, ...result });
      } catch (error) {
        console.error("macro ingestion failed", { seriesId: series.id, provider: series.provider, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return due.length;
  };
}
