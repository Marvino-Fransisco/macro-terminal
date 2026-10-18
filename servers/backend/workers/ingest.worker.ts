import type { MacroRepository } from "@/modules/macro/application/ports/macro-repository.port";
import type { createIngestSeries } from "@/modules/macro/application/use-cases/ingest-series";

export function createIngestWorker(repository: MacroRepository, ingest: ReturnType<typeof createIngestSeries>) {
  return async () => {
    const due = await repository.claimDue(new Date(), 10);
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
