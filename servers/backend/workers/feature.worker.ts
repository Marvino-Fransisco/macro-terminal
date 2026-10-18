import type { MacroRepository } from "@/modules/macro/ports/macro-repository.port";
import type { ComputeFeaturesUseCase } from "@/modules/macro";

export function createFeatureWorker(repository: MacroRepository, compute: ComputeFeaturesUseCase) {
  return async () => {
    const jobs = await repository.pendingFeatureJobs(10);
    for (const job of jobs) {
      try {
        const rows = await compute(job.countryId, job.requestedAt);
        console.info("macro features computed", { country: job.countryId, rows });
      } catch (error) {
        console.error("macro features failed; durable job retained", { country: job.countryId, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return jobs.length;
  };
}
