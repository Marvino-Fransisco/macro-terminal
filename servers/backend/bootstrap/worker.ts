import { ENV } from "@/configs/env";
import { createSupabaseConnection } from "@/infrastructure/database/connections/supabase.connection";
import { createMacroRepository } from "@/infrastructure/database/repositories/macro/macro-repository.drizzle";
import { createFredProvider } from "@/infrastructure/macro-providers/fred/fred.provider";
import { createWorldBankProvider } from "@/infrastructure/macro-providers/worldbank/worldbank.provider";
import { createProviderRegistry } from "@/infrastructure/macro-providers/provider-registry";
import { createIngestSeries } from "@/modules/macro/application/use-cases/ingest-series";
import { createIngestWorker } from "@/workers/ingest.worker";
import { createFeatureWorker } from "@/workers/feature.worker";
import { createComputeFeatures } from "@/modules/macro/application/use-cases/compute-features";
import { createProviderAlertWorker } from "@/workers/provider-alert.worker";

async function main() {
  const db = await createSupabaseConnection();
  const repository = createMacroRepository(db);
  const resolve = createProviderRegistry({
    worldbank: createWorldBankProvider(ENV.WORLD_BANK_API_URL),
    ...(ENV.FRED_API_KEY ? { fred: createFredProvider(ENV.FRED_API_KEY, ENV.FRED_API_URL) } : {}),
  });
  const tick = createIngestWorker(repository, createIngestSeries(repository, resolve));
  const features = createFeatureWorker(repository, createComputeFeatures(repository));
  const alerts = createProviderAlertWorker(repository);
  let lastAlertCheck = 0;
  let stopping = false;
  let wake: (() => void) | undefined;
  const stop = () => { stopping = true; wake?.(); };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  try {
    while (!stopping) {
      await tick();
      await features();
      if (Date.now() - lastAlertCheck >= 60_000) {
        await alerts();
        lastAlertCheck = Date.now();
      }
      if (stopping) break;
      await new Promise<void>((resolveWait) => {
        const timer = setTimeout(resolveWait, 5000);
        wake = () => { clearTimeout(timer); resolveWait(); };
      });
      wake = undefined;
    }
  } finally {
    process.removeListener("SIGTERM", stop);
    process.removeListener("SIGINT", stop);
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Macro worker stopped", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
