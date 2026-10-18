import type { MacroDataProvider } from "@/modules/macro/ports/macro-data-provider.port";
import type { Provider } from "@/modules/macro";

export type ProviderRegistry = (provider: Provider) => MacroDataProvider;

export function createProviderRegistry(providers: Partial<Record<Provider, MacroDataProvider>>): ProviderRegistry {
  return (provider) => {
    const adapter = providers[provider];
    if (!adapter) throw new Error(`Provider is not configured: ${provider}`);
    return adapter;
  };
}
