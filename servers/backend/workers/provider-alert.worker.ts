import type { MacroRepository } from "@/modules/macro/ports/macro-repository.port";

export function createProviderAlertWorker(repository: Pick<MacroRepository, "providerFailures">, alert = (event: { provider: string; failedSeriesIds: string[] }) => console.error("macro provider repeated ingestion failures", event)) {
  const active = new Map<string, string>();
  return async () => {
    const failures = await repository.providerFailures();
    const providers = new Map<string, string[]>();
    for (const failure of failures) providers.set(failure.provider, [...(providers.get(failure.provider) ?? []), failure.seriesId]);
    for (const [provider, failedSeriesIds] of providers) {
      failedSeriesIds.sort();
      const signature = failedSeriesIds.join(",");
      if (active.get(provider) !== signature) alert({ provider, failedSeriesIds });
      active.set(provider, signature);
    }
    for (const provider of active.keys()) if (!providers.has(provider)) active.delete(provider);
  };
}
