import type { MacroRepository } from "@/modules/macro/application/ports/macro-repository.port";
import type { createComputeFeatures } from "@/modules/macro/application/use-cases/compute-features";

export function createFeatureWorker(repository: MacroRepository, compute: ReturnType<typeof createComputeFeatures>) {
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
