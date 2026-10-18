import type { Provider } from "../../../domain/value-objects/provider.vo";

export type AttributionResponse = {
  provider: Provider;
  notice: string;
  termsUrl: string | null;
  changes: string;
}
